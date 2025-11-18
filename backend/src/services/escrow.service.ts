import Escrow, { EscrowStatus } from '../models/Escrow';
import Order from '../models/Order';
import Seller from '../models/Seller';
import UserListing from '../models/UserListing';
import Payment from '../models/Payment';

class EscrowService {
  // Platform fee percentage
  private readonly PLATFORM_FEE_PERCENT = 5; // 5% platform fee
  private readonly AUTO_RELEASE_DAYS = 7; // Auto-release after 7 days

  // Create escrow for an order
  async createEscrow(data: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    listingId: string;
    amount: number;
    currency: string;
    paymentId?: string;
  }) {
    // Verify order exists
    const order = await Order.findByPk(data.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Verify seller exists
    const seller = await Seller.findByPk(data.sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Verify listing exists
    const listing = await UserListing.findByPk(data.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Check if escrow already exists for this order
    const existingEscrow = await Escrow.findOne({ where: { orderId: data.orderId } });
    if (existingEscrow) {
      throw new Error('Escrow already exists for this order');
    }

    // Calculate platform fee and seller amount
    const platformFee = (data.amount * this.PLATFORM_FEE_PERCENT) / 100;
    const sellerAmount = data.amount - platformFee;

    // Calculate auto-release date
    const autoReleaseAt = new Date();
    autoReleaseAt.setDate(autoReleaseAt.getDate() + this.AUTO_RELEASE_DAYS);

    // Create escrow
    const escrow = await Escrow.create({
      orderId: data.orderId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      listingId: data.listingId,
      amount: data.amount,
      currency: data.currency,
      platformFee,
      sellerAmount,
      status: EscrowStatus.PENDING,
      paymentId: data.paymentId,
      releaseCondition: 'delivery_confirmed',
      autoReleaseAt,
    });

    return escrow;
  }

  // Fund escrow (payment completed)
  async fundEscrow(escrowId: string, paymentId: string) {
    const escrow = await Escrow.findByPk(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new Error('Escrow is not in pending status');
    }

    escrow.status = EscrowStatus.FUNDED;
    escrow.paymentId = paymentId;
    await escrow.save();

    return escrow;
  }

  // Release funds to seller
  async releaseEscrow(escrowId: string, releasedBy: 'buyer' | 'admin' | 'auto') {
    const escrow = await Escrow.findByPk(escrowId, {
      include: [
        {
          model: Seller,
          as: 'seller',
        },
        {
          model: Order,
          as: 'order',
        },
      ],
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (!escrow.canRelease()) {
      throw new Error(`Cannot release escrow in status: ${escrow.status}`);
    }

    // Release funds
    await escrow.release();

    // Update seller stats
    const seller = await Seller.findByPk(escrow.sellerId);
    if (seller) {
      seller.totalSales += 1;
      seller.totalRevenue += escrow.sellerAmount;
      await seller.save();
    }

    // Update order status
    const order = await Order.findByPk(escrow.orderId);
    if (order) {
      order.status = 'completed';
      await order.save();
    }

    return escrow;
  }

  // Refund to buyer
  async refundEscrow(escrowId: string, reason: string, refundedBy: 'seller' | 'admin') {
    const escrow = await Escrow.findByPk(escrowId, {
      include: [
        {
          model: Order,
          as: 'order',
        },
      ],
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (!escrow.canRefund()) {
      throw new Error(`Cannot refund escrow in status: ${escrow.status}`);
    }

    // Refund funds
    await escrow.refund();

    // Update order status
    const order = await Order.findByPk(escrow.orderId);
    if (order) {
      order.status = 'cancelled';
      await order.save();
    }

    // Add metadata
    escrow.metadata = {
      ...escrow.metadata,
      refundReason: reason,
      refundedBy,
    };
    await escrow.save();

    return escrow;
  }

  // Mark escrow as disputed
  async disputeEscrow(escrowId: string, disputeId: string) {
    const escrow = await Escrow.findByPk(escrowId);
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    await escrow.dispute(disputeId);
    return escrow;
  }

  // Get escrow by ID
  async getEscrowById(escrowId: string) {
    const escrow = await Escrow.findByPk(escrowId, {
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: Seller,
          as: 'seller',
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow;
  }

  // Get escrow by order ID
  async getEscrowByOrderId(orderId: string) {
    const escrow = await Escrow.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: Seller,
          as: 'seller',
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
    });

    return escrow;
  }

  // Get seller's escrows
  async getSellerEscrows(sellerId: string, status?: EscrowStatus) {
    const where: any = { sellerId };

    if (status) {
      where.status = status;
    }

    const escrows = await Escrow.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return escrows;
  }

  // Get buyer's escrows
  async getBuyerEscrows(buyerId: string, status?: EscrowStatus) {
    const where: any = { buyerId };

    if (status) {
      where.status = status;
    }

    const escrows = await Escrow.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
        },
        {
          model: Seller,
          as: 'seller',
        },
        {
          model: UserListing,
          as: 'listing',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return escrows;
  }

  // Auto-release expired escrows (to be called by cron job)
  async autoReleaseExpiredEscrows() {
    const now = new Date();

    const expiredEscrows = await Escrow.findAll({
      where: {
        status: EscrowStatus.FUNDED,
        autoReleaseAt: {
          [Op.lte]: now,
        },
      },
    });

    const results = [];

    for (const escrow of expiredEscrows) {
      try {
        await this.releaseEscrow(escrow.id, 'auto');
        results.push({ escrowId: escrow.id, success: true });
      } catch (error: any) {
        results.push({ escrowId: escrow.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // Get escrow statistics (admin)
  async getEscrowStats() {
    const totalEscrows = await Escrow.count();
    const pendingEscrows = await Escrow.count({ where: { status: EscrowStatus.PENDING } });
    const fundedEscrows = await Escrow.count({ where: { status: EscrowStatus.FUNDED } });
    const releasedEscrows = await Escrow.count({ where: { status: EscrowStatus.RELEASED } });
    const refundedEscrows = await Escrow.count({ where: { status: EscrowStatus.REFUNDED } });
    const disputedEscrows = await Escrow.count({ where: { status: EscrowStatus.DISPUTED } });

    // Calculate total amounts
    const totalAmount = await Escrow.sum('amount', {
      where: { status: { [Op.in]: [EscrowStatus.FUNDED, EscrowStatus.RELEASED] } },
    });

    const totalPlatformFees = await Escrow.sum('platformFee', {
      where: { status: EscrowStatus.RELEASED },
    });

    return {
      totalEscrows,
      pendingEscrows,
      fundedEscrows,
      releasedEscrows,
      refundedEscrows,
      disputedEscrows,
      totalAmount: totalAmount || 0,
      totalPlatformFees: totalPlatformFees || 0,
    };
  }
}

// Need to import Op for the auto-release function
import { Op } from 'sequelize';

export default new EscrowService();
