import { Op } from 'sequelize';
import Review from '../models/review.model';
import { User, Card, Order } from '../models';
import logger from '../utils/logger';

export class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data: {
    userId: string;
    cardId: string;
    orderId?: string;
    rating: number;
    title?: string;
    comment?: string;
  }) {
    // Check if user has already reviewed this card
    const existingReview = await Review.findOne({
      where: {
        userId: data.userId,
        cardId: data.cardId,
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this card');
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false;
    if (data.orderId) {
      const order = await Order.findOne({
        where: {
          id: data.orderId,
          userId: data.userId,
          cardId: data.cardId,
          status: 'completed',
        },
      });
      isVerifiedPurchase = !!order;
    } else {
      // Check if user has purchased this card
      const purchase = await Order.findOne({
        where: {
          userId: data.userId,
          cardId: data.cardId,
          status: 'completed',
        },
      });
      isVerifiedPurchase = !!purchase;
    }

    const review = await Review.create({
      ...data,
      isVerifiedPurchase,
    });

    // Update card rating
    await this.updateCardRating(data.cardId);

    logger.info(`Review created by user ${data.userId} for card ${data.cardId}`);

    return review;
  }

  /**
   * Get reviews for a card
   */
  async getCardReviews(cardId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { rows: reviews, count } = await Review.findAndCountAll({
      where: {
        cardId,
        status: 'approved',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      reviews,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { rows: reviews, count } = await Review.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Card,
          as: 'card',
          attributes: ['id', 'name', 'category', 'price'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      reviews,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string) {
    const review = await Review.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Card,
          as: 'card',
          attributes: ['id', 'name', 'category', 'price'],
        },
      ],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  }

  /**
   * Update a review
   */
  async updateReview(
    id: string,
    userId: string,
    data: {
      rating?: number;
      title?: string;
      comment?: string;
    }
  ) {
    const review = await Review.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    await review.update(data);

    // Update card rating if rating changed
    if (data.rating) {
      await this.updateCardRating(review.cardId);
    }

    logger.info(`Review ${id} updated by user ${userId}`);

    return review;
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string, userId: string) {
    const review = await Review.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    const cardId = review.cardId;
    await review.destroy();

    // Update card rating
    await this.updateCardRating(cardId);

    logger.info(`Review ${id} deleted by user ${userId}`);
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(id: string) {
    const review = await Review.findByPk(id);

    if (!review) {
      throw new Error('Review not found');
    }

    await review.increment('helpfulCount');

    return review.reload();
  }

  /**
   * Update card rating based on reviews
   */
  private async updateCardRating(cardId: string) {
    const reviews = await Review.findAll({
      where: {
        cardId,
        status: 'approved',
      },
      attributes: ['rating'],
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Card.update(
        {
          rating: Number(averageRating.toFixed(1)),
          reviewCount: reviews.length,
        },
        {
          where: { id: cardId },
        }
      );

      logger.info(`Card ${cardId} rating updated: ${averageRating.toFixed(1)} (${reviews.length} reviews)`);
    }
  }

  /**
   * Get review statistics for a card
   */
  async getCardReviewStats(cardId: string) {
    const reviews = await Review.findAll({
      where: {
        cardId,
        status: 'approved',
      },
      attributes: ['rating'],
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(1));

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }
}

export default new ReviewService();
