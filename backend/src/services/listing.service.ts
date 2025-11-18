import UserListing, { ListingStatus, ListingType } from '../models/UserListing';
import Seller, { SellerStatus } from '../models/Seller';
import User from '../models/User';
import { Op } from 'sequelize';
import { VirtualProductCategory, ProductDeliveryType } from '../types/virtualProduct.types';

class ListingService {
  // Create a new listing
  async createListing(data: {
    sellerId: string;
    title: string;
    description: string;
    category: VirtualProductCategory;
    subcategory?: string;
    images?: string[];
    price: number;
    currency?: string;
    originalPrice?: number;
    discountPercent?: number;
    deliveryType: ProductDeliveryType;
    deliveryTime?: number;
    autoDelivery?: boolean;
    stock: number;
    listingType?: ListingType;
    features?: string[];
    metadata?: any;
    tags?: string[];
    termsAndConditions?: string;
    refundPolicy?: string;
  }) {
    // Verify seller exists and is active
    const seller = await Seller.findByPk(data.sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    if (seller.status !== SellerStatus.ACTIVE) {
      throw new Error('Seller account is not active');
    }

    // Create listing
    const listing = await UserListing.create({
      sellerId: data.sellerId,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      images: data.images || [],
      price: data.price,
      currency: data.currency || 'USD',
      originalPrice: data.originalPrice,
      discountPercent: data.discountPercent,
      deliveryType: data.deliveryType,
      deliveryTime: data.deliveryTime || 30,
      autoDelivery: data.autoDelivery || false,
      stock: data.stock,
      soldCount: 0,
      listingType: data.listingType || ListingType.MULTIPLE,
      features: data.features || [],
      metadata: data.metadata || {},
      status: ListingStatus.DRAFT,
      rating: 0,
      totalReviews: 0,
      views: 0,
      favorites: 0,
      tags: data.tags || [],
      termsAndConditions: data.termsAndConditions,
      refundPolicy: data.refundPolicy,
    });

    return listing;
  }

  // Update listing
  async updateListing(listingId: string, sellerId: string, data: Partial<UserListing>) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Verify ownership
    if (listing.sellerId !== sellerId) {
      throw new Error('Not authorized to update this listing');
    }

    // Don't allow updating if listing is under review
    if (listing.status === ListingStatus.PENDING_REVIEW) {
      throw new Error('Cannot update listing while under review');
    }

    await listing.update(data);
    return listing;
  }

  // Submit listing for review
  async submitForReview(listingId: string, sellerId: string) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Verify ownership
    if (listing.sellerId !== sellerId) {
      throw new Error('Not authorized');
    }

    // Validate listing has required fields
    if (!listing.title || !listing.description || !listing.price || listing.images.length === 0) {
      throw new Error('Listing is incomplete. Please fill in all required fields.');
    }

    listing.status = ListingStatus.PENDING_REVIEW;
    await listing.save();

    return listing;
  }

  // Approve listing (admin)
  async approveListing(listingId: string, adminId: string, notes?: string) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.status = ListingStatus.ACTIVE;
    listing.approvedAt = new Date();
    listing.publishedAt = new Date();
    listing.reviewedBy = adminId;
    listing.reviewNotes = notes;

    await listing.save();
    return listing;
  }

  // Reject listing (admin)
  async rejectListing(listingId: string, adminId: string, reason: string) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.status = ListingStatus.REJECTED;
    listing.rejectedAt = new Date();
    listing.reviewedBy = adminId;
    listing.rejectionReason = reason;

    await listing.save();
    return listing;
  }

  // Get listing by ID
  async getListingById(listingId: string, incrementView: boolean = false) {
    const listing = await UserListing.findByPk(listingId, {
      include: [
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
      ],
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Increment view count
    if (incrementView) {
      listing.views += 1;
      await listing.save();
    }

    return listing;
  }

  // Get seller's listings
  async getSellerListings(sellerId: string, filters?: {
    status?: ListingStatus;
    category?: VirtualProductCategory;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = { sellerId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    const { rows: listings, count: total } = await UserListing.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Search listings
  async searchListings(filters: {
    search?: string;
    category?: VirtualProductCategory;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    deliveryType?: ProductDeliveryType;
    features?: string[];
    tags?: string[];
    sortBy?: 'price' | 'rating' | 'sales' | 'recent';
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {
      status: ListingStatus.ACTIVE,
    };

    if (filters.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
        { tags: { [Op.contains]: [filters.search] } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.minPrice !== undefined) {
      where.price = { ...where.price, [Op.gte]: filters.minPrice };
    }

    if (filters.maxPrice !== undefined) {
      where.price = { ...where.price, [Op.lte]: filters.maxPrice };
    }

    if (filters.minRating) {
      where.rating = { [Op.gte]: filters.minRating };
    }

    if (filters.deliveryType) {
      where.deliveryType = filters.deliveryType;
    }

    if (filters.features && filters.features.length > 0) {
      where.features = { [Op.overlap]: filters.features };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { [Op.overlap]: filters.tags };
    }

    // Determine sort order
    let order: any = [['createdAt', 'DESC']];
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder || 'DESC';
      switch (filters.sortBy) {
        case 'price':
          order = [['price', sortOrder]];
          break;
        case 'rating':
          order = [['rating', sortOrder]];
          break;
        case 'sales':
          order = [['soldCount', sortOrder]];
          break;
        case 'recent':
          order = [['createdAt', sortOrder]];
          break;
      }
    }

    const { rows: listings, count: total } = await UserListing.findAndCountAll({
      where,
      include: [
        {
          model: Seller,
          as: 'seller',
          attributes: ['id', 'storeName', 'rating', 'level', 'verified'],
        },
      ],
      limit,
      offset,
      order,
    });

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get pending listings (admin)
  async getPendingListings(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { rows: listings, count: total } = await UserListing.findAndCountAll({
      where: { status: ListingStatus.PENDING_REVIEW },
      include: [
        {
          model: Seller,
          as: 'seller',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'ASC']],
    });

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update stock
  async updateStock(listingId: string, sellerId: string, stock: number) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId !== sellerId) {
      throw new Error('Not authorized');
    }

    if (listing.listingType === ListingType.UNLIMITED) {
      throw new Error('Cannot update stock for unlimited listings');
    }

    await listing.increaseStock(stock - listing.stock);
    return listing;
  }

  // Delete listing
  async deleteListing(listingId: string, sellerId: string) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId !== sellerId) {
      throw new Error('Not authorized');
    }

    // Can only delete draft or rejected listings
    if (![ListingStatus.DRAFT, ListingStatus.REJECTED].includes(listing.status)) {
      throw new Error('Can only delete draft or rejected listings');
    }

    await listing.destroy();
    return { success: true, message: 'Listing deleted successfully' };
  }

  // Suspend listing (admin)
  async suspendListing(listingId: string, reason: string, adminId: string) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.status = ListingStatus.SUSPENDED;
    listing.reviewedBy = adminId;
    listing.rejectionReason = reason;

    await listing.save();
    return listing;
  }

  // Add review to listing
  async addReview(listingId: string, rating: number) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Calculate new average rating
    const totalRating = listing.rating * listing.totalReviews + rating;
    listing.totalReviews += 1;
    listing.rating = totalRating / listing.totalReviews;

    await listing.save();
    return listing;
  }

  // Toggle favorite
  async toggleFavorite(listingId: string, increment: boolean) {
    const listing = await UserListing.findByPk(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    listing.favorites += increment ? 1 : -1;
    await listing.save();

    return listing;
  }
}

export default new ListingService();
