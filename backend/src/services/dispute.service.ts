import Dispute, { DisputeStatus, DisputeReason, DisputeResolution } from '../models/Dispute';
import Escrow from '../models/Escrow';
import Order from '../models/Order';
import Seller from '../models/Seller';
import UserListing from '../models/UserListing';
import User from '../models/User';
import escrowService from './escrow.service';
import { Op } from 'sequelize';

class DisputeService {
  // Create a dispute
  async createDispute(data: {
    orderId: string;
    buyerId: string;
    reason: DisputeReason;
    description: string;
    evidence?: string[];
  }) {
    // Verify order exists
    const order = await Order.findByPk(data.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Get escrow
    const escrow = await escrowService.getEscrowByOrderId(data.orderId);
    if (!escrow) {
      throw new Error('Escrow not found for this order');
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({ where: { orderId: data.orderId } });
    if (existingDispute) {
      throw new Error('Dispute already exists for this order');
    }

    // Create dispute
    const dispute = await Dispute.create({
      orderId: data.orderId,
      escrowId: escrow.id,
      buyerId: data.buyerId,
      sellerId: escrow.sellerId,
      listingId: escrow.listingId,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence || [],
      status: DisputeStatus.OPEN,
      openedAt: new Date(),
    });

    // Mark escrow as disputed
    await escrowService.disputeEscrow(escrow.id, dispute.id);

    return dispute;
  }

  // Get dispute by ID
  async getDisputeById(disputeId: string) {
    const dispute = await Dispute.findByPk(disputeId, {
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: Escrow,
          as: 'escrow',
        },
        {
          model: Seller,
          as: 'seller',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'avatar'],
            },
          ],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'email', 'avatar'],
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    return dispute;
  }

  // Add seller response
  async addSellerResponse(disputeId: string, sellerId: string, response: string) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.sellerId !== sellerId) {
      throw new Error('Not authorized');
    }

    dispute.sellerResponse = response;
    dispute.status = DisputeStatus.UNDER_REVIEW;
    await dispute.save();

    return dispute;
  }

  // Add buyer response
  async addBuyerResponse(disputeId: string, buyerId: string, response: string) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.buyerId !== buyerId) {
      throw new Error('Not authorized');
    }

    dispute.buyerResponse = response;
    await dispute.save();

    return dispute;
  }

  // Add evidence
  async addEvidence(disputeId: string, userId: string, evidenceUrl: string) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Verify user is buyer or seller
    if (dispute.buyerId !== userId && dispute.sellerId !== userId) {
      throw new Error('Not authorized');
    }

    await dispute.addEvidence(evidenceUrl);
    return dispute;
  }

  // Assign dispute to admin
  async assignDispute(disputeId: string, adminId: string) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    dispute.assignedTo = adminId;
    dispute.status = DisputeStatus.UNDER_REVIEW;
    await dispute.save();

    return dispute;
  }

  // Resolve dispute (admin)
  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: DisputeResolution,
    notes?: string,
    refundAmount?: number
  ) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (!dispute.escrowId) {
      throw new Error('No escrow associated with this dispute');
    }

    // Resolve the dispute
    await dispute.resolve(resolution, notes, refundAmount, adminId);

    // Handle escrow based on resolution
    switch (resolution) {
      case DisputeResolution.REFUND_FULL:
        await escrowService.refundEscrow(dispute.escrowId, 'Dispute resolved in buyer favor', 'admin');
        break;

      case DisputeResolution.REFUND_PARTIAL:
        // Partial refund would require custom handling
        // For now, we'll add metadata and manually process
        dispute.metadata = {
          ...dispute.metadata,
          partialRefundAmount: refundAmount,
          requiresManualProcessing: true,
        };
        await dispute.save();
        break;

      case DisputeResolution.BUYER_FAVOR:
        await escrowService.refundEscrow(dispute.escrowId, 'Dispute resolved in buyer favor', 'admin');
        break;

      case DisputeResolution.SELLER_FAVOR:
        await escrowService.releaseEscrow(dispute.escrowId, 'admin');
        break;

      case DisputeResolution.MUTUAL_AGREEMENT:
        // Handle based on agreement terms in notes
        break;

      case DisputeResolution.REPLACE_PRODUCT:
        // Product replacement - seller should redeliver
        dispute.metadata = {
          ...dispute.metadata,
          requiresReplacement: true,
        };
        await dispute.save();
        break;
    }

    return dispute;
  }

  // Close dispute
  async closeDispute(disputeId: string, adminId: string) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    await dispute.close();
    return dispute;
  }

  // Escalate dispute
  async escalateDispute(disputeId: string, adminId: string) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    await dispute.escalate(adminId);
    return dispute;
  }

  // Get all disputes (admin)
  async getAllDisputes(filters?: {
    status?: DisputeStatus;
    reason?: DisputeReason;
    assignedTo?: string;
    sellerId?: string;
    buyerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.reason) {
      where.reason = filters.reason;
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }

    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }

    const { rows: disputes, count: total } = await Dispute.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: Seller,
          as: 'seller',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar'],
            },
          ],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: UserListing,
          as: 'listing',
          attributes: ['id', 'title', 'price'],
        },
      ],
      limit,
      offset,
      order: [['openedAt', 'DESC']],
    });

    return {
      disputes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get buyer's disputes
  async getBuyerDisputes(buyerId: string) {
    const disputes = await Dispute.findAll({
      where: { buyerId },
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: Seller,
          as: 'seller',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar'],
            },
          ],
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
      order: [['openedAt', 'DESC']],
    });

    return disputes;
  }

  // Get seller's disputes
  async getSellerDisputes(sellerId: string) {
    const disputes = await Dispute.findAll({
      where: { sellerId },
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
      order: [['openedAt', 'DESC']],
    });

    return disputes;
  }

  // Get dispute statistics (admin)
  async getDisputeStats() {
    const totalDisputes = await Dispute.count();
    const openDisputes = await Dispute.count({ where: { status: DisputeStatus.OPEN } });
    const underReviewDisputes = await Dispute.count({ where: { status: DisputeStatus.UNDER_REVIEW } });
    const resolvedDisputes = await Dispute.count({ where: { status: DisputeStatus.RESOLVED } });
    const closedDisputes = await Dispute.count({ where: { status: DisputeStatus.CLOSED } });

    // Count by reason
    const disputesByReason = await Dispute.findAll({
      attributes: [
        'reason',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['reason'],
    });

    // Count by resolution
    const disputesByResolution = await Dispute.findAll({
      attributes: [
        'resolution',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        resolution: { [Op.ne]: null },
      },
      group: ['resolution'],
    });

    return {
      totalDisputes,
      openDisputes,
      underReviewDisputes,
      resolvedDisputes,
      closedDisputes,
      disputesByReason,
      disputesByResolution,
    };
  }
}

import sequelize from '../config/database';

export default new DisputeService();
