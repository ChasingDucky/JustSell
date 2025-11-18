import { Op } from 'sequelize';
import { Card, Order, Supplier } from '../models';
import { redisClient } from '../config/redis';

export class RecommendationService {
  /**
   * Get personalized recommendations based on user history
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    const cacheKey = `recommendations:${userId}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get user's purchase history
    const userOrders = await Order.findAll({
      where: { userId, status: 'completed' },
      include: [
        {
          model: Card,
          as: 'card',
          attributes: ['category', 'tags'],
        },
      ],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });

    // Extract categories and tags from purchase history
    const categories = new Set<string>();
    const tags = new Set<string>();

    userOrders.forEach((order) => {
      if (order.card) {
        categories.add(order.card.category);
        if (order.card.tags) {
          order.card.tags.forEach((tag: string) => tags.add(tag));
        }
      }
    });

    // Find similar cards
    const recommendations = await Card.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { category: { [Op.in]: Array.from(categories) } },
          { tags: { [Op.overlap]: Array.from(tags) } },
        ],
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
      limit,
      order: [
        ['discount', 'DESC'],
        ['rating', 'DESC'],
      ],
    });

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(recommendations), { EX: 3600 });

    return recommendations;
  }

  /**
   * Get best deals (highest discounts)
   */
  async getBestDeals(limit: number = 10) {
    const cacheKey = 'best_deals';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const deals = await Card.findAll({
      where: {
        status: 'active',
        discount: { [Op.gt]: 0 },
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
      limit,
      order: [['discount', 'DESC']],
    });

    // Cache for 30 minutes
    await redisClient.set(cacheKey, JSON.stringify(deals), { EX: 1800 });

    return deals;
  }

  /**
   * Get similar cards
   */
  async getSimilarCards(cardId: string, limit: number = 5) {
    const card = await Card.findByPk(cardId);
    if (!card) {
      return [];
    }

    const similarCards = await Card.findAll({
      where: {
        id: { [Op.ne]: cardId },
        status: 'active',
        [Op.or]: [
          { category: card.category },
          { tags: { [Op.overlap]: card.tags || [] } },
        ],
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
      limit,
      order: [['rating', 'DESC']],
    });

    return similarCards;
  }

  /**
   * Get trending cards (most purchased in last 7 days)
   */
  async getTrendingCards(limit: number = 10) {
    const cacheKey = 'trending_cards';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get most ordered cards in last 7 days
    const trendingCardIds = await Order.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: sevenDaysAgo },
      },
      attributes: [
        'cardId',
        [Order.sequelize!.fn('COUNT', Order.sequelize!.col('cardId')), 'orderCount'],
      ],
      group: ['cardId'],
      order: [[Order.sequelize!.literal('orderCount'), 'DESC']],
      limit,
      raw: true,
    });

    const cardIds = (trendingCardIds as any).map((item: any) => item.cardId);

    const trendingCards = await Card.findAll({
      where: {
        id: { [Op.in]: cardIds },
        status: 'active',
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
    });

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(trendingCards), { EX: 3600 });

    return trendingCards;
  }

  /**
   * Get cards by price comparison (same category, different suppliers)
   */
  async getPriceComparison(category: string, denomination: number) {
    const cards = await Card.findAll({
      where: {
        category,
        denomination: { [Op.between]: [denomination * 0.9, denomination * 1.1] },
        status: 'active',
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
      order: [['price', 'ASC']],
    });

    return cards;
  }
}

export default new RecommendationService();
