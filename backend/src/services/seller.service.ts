import Seller, { SellerStatus, SellerLevel } from '../models/Seller';
import User from '../models/User';
import UserListing from '../models/UserListing';
import { Op } from 'sequelize';

class SellerService {
  // Apply to become a seller
  async applyAsSeller(data: {
    userId: string;
    storeName: string;
    description?: string;
    logo?: string;
    businessLicense?: string;
    idVerification?: string;
  }) {
    // Check if user exists
    const user = await User.findByPk(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a seller
    const existingSeller = await Seller.findOne({ where: { userId: data.userId } });
    if (existingSeller) {
      throw new Error('User is already a seller');
    }

    // Check if store name is taken
    const storeNameTaken = await Seller.findOne({ where: { storeName: data.storeName } });
    if (storeNameTaken) {
      throw new Error('Store name is already taken');
    }

    // Create seller
    const seller = await Seller.create({
      userId: data.userId,
      storeName: data.storeName,
      description: data.description,
      logo: data.logo,
      businessLicense: data.businessLicense,
      idVerification: data.idVerification,
      status: SellerStatus.PENDING,
      level: SellerLevel.NEWCOMER,
      verified: false,
      rating: 0,
      totalSales: 0,
      totalRevenue: 0,
      completionRate: 100,
      responseTime: 0,
      totalReviews: 0,
      positiveReviews: 0,
      neutralReviews: 0,
      negativeReviews: 0,
    });

    return seller;
  }

  // Approve seller application
  async approveSeller(sellerId: string, adminId: string) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    if (seller.status !== SellerStatus.PENDING) {
      throw new Error('Only pending sellers can be approved');
    }

    seller.status = SellerStatus.ACTIVE;
    seller.approvedAt = new Date();
    seller.metadata = {
      ...seller.metadata,
      approvedBy: adminId,
    };

    await seller.save();
    return seller;
  }

  // Reject seller application
  async rejectSeller(sellerId: string, reason: string, adminId: string) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    seller.status = SellerStatus.SUSPENDED;
    seller.suspendedAt = new Date();
    seller.metadata = {
      ...seller.metadata,
      rejectionReason: reason,
      rejectedBy: adminId,
    };

    await seller.save();
    return seller;
  }

  // Get seller by ID
  async getSellerById(sellerId: string) {
    const seller = await Seller.findByPk(sellerId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar'],
        },
      ],
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    return seller;
  }

  // Get seller by user ID
  async getSellerByUserId(userId: string) {
    const seller = await Seller.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar'],
        },
      ],
    });

    return seller;
  }

  // Update seller profile
  async updateSellerProfile(sellerId: string, data: {
    storeName?: string;
    description?: string;
    logo?: string;
    bankAccount?: string;
    paypalEmail?: string;
    cryptoAddress?: string;
  }) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Check if new store name is taken
    if (data.storeName && data.storeName !== seller.storeName) {
      const storeNameTaken = await Seller.findOne({ where: { storeName: data.storeName } });
      if (storeNameTaken) {
        throw new Error('Store name is already taken');
      }
    }

    await seller.update(data);
    return seller;
  }

  // Update seller statistics
  async updateSellerStats(sellerId: string, data: {
    totalSales?: number;
    totalRevenue?: number;
    completionRate?: number;
    responseTime?: number;
  }) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    await seller.update(data);

    // Check if seller can upgrade level
    if (seller.canUpgradeLevel()) {
      await this.upgradeSellerLevel(sellerId);
    }

    return seller;
  }

  // Upgrade seller level
  async upgradeSellerLevel(sellerId: string) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    if (!seller.canUpgradeLevel()) {
      throw new Error('Seller does not meet upgrade requirements');
    }

    const levels = [
      SellerLevel.NEWCOMER,
      SellerLevel.BRONZE,
      SellerLevel.SILVER,
      SellerLevel.GOLD,
      SellerLevel.PLATINUM,
      SellerLevel.DIAMOND,
    ];

    const currentIndex = levels.indexOf(seller.level);
    if (currentIndex < levels.length - 1) {
      seller.level = levels[currentIndex + 1];
      await seller.save();
    }

    return seller;
  }

  // Add review to seller
  async addReview(sellerId: string, rating: number) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Calculate new average rating
    const totalRating = seller.rating * seller.totalReviews + rating;
    seller.totalReviews += 1;
    seller.rating = totalRating / seller.totalReviews;

    // Update review counts
    if (rating >= 4) {
      seller.positiveReviews += 1;
    } else if (rating >= 3) {
      seller.neutralReviews += 1;
    } else {
      seller.negativeReviews += 1;
    }

    await seller.save();
    return seller;
  }

  // Get seller dashboard stats
  async getSellerDashboard(sellerId: string) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Get active listings count
    const activeListings = await UserListing.count({
      where: { sellerId, status: 'active' },
    });

    // Get total listings count
    const totalListings = await UserListing.count({
      where: { sellerId },
    });

    // Get pending orders count
    const pendingOrders = 0; // Will be implemented with order service

    // Calculate reputation score
    const reputationScore = seller.getReputationScore();

    return {
      seller,
      stats: {
        activeListings,
        totalListings,
        pendingOrders,
        totalSales: seller.totalSales,
        totalRevenue: seller.totalRevenue,
        rating: seller.rating,
        totalReviews: seller.totalReviews,
        completionRate: seller.completionRate,
        responseTime: seller.responseTime,
        reputationScore,
        level: seller.level,
        verified: seller.verified,
      },
    };
  }

  // Get all sellers (for admin)
  async getAllSellers(filters?: {
    status?: SellerStatus;
    level?: SellerLevel;
    verified?: boolean;
    minRating?: number;
    search?: string;
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

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }

    if (filters?.minRating) {
      where.rating = { [Op.gte]: filters.minRating };
    }

    if (filters?.search) {
      where[Op.or] = [
        { storeName: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const { rows: sellers, count: total } = await Seller.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      sellers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Suspend seller
  async suspendSeller(sellerId: string, reason: string, adminId: string) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    seller.status = SellerStatus.SUSPENDED;
    seller.suspendedAt = new Date();
    seller.metadata = {
      ...seller.metadata,
      suspensionReason: reason,
      suspendedBy: adminId,
    };

    await seller.save();
    return seller;
  }

  // Reactivate seller
  async reactivateSeller(sellerId: string, adminId: string) {
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    seller.status = SellerStatus.ACTIVE;
    seller.suspendedAt = null;
    seller.metadata = {
      ...seller.metadata,
      reactivatedBy: adminId,
      reactivatedAt: new Date(),
    };

    await seller.save();
    return seller;
  }
}

export default new SellerService();
