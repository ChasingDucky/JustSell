import { Op } from 'sequelize';
import { Card, Supplier, CardCode } from '../models';
import { AppError } from '../middleware/errorHandler';
import { redisClient } from '../config/redis';

export class CardService {
  /**
   * Get all cards with filters and pagination
   */
  async getCards(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minDenomination?: number;
    maxDenomination?: number;
    supplierId?: string;
    search?: string;
    tags?: string[];
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      category,
      minPrice,
      maxPrice,
      minDenomination,
      maxDenomination,
      supplierId,
      search,
      tags,
      status = 'active',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const where: any = { status };

    if (category) {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price[Op.gte] = minPrice;
      if (maxPrice !== undefined) where.price[Op.lte] = maxPrice;
    }

    if (minDenomination !== undefined || maxDenomination !== undefined) {
      where.denomination = {};
      if (minDenomination !== undefined) where.denomination[Op.gte] = minDenomination;
      if (maxDenomination !== undefined) where.denomination[Op.lte] = maxDenomination;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = { [Op.overlap]: tags };
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Card.findAndCountAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      cards: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get card by ID
   */
  async getCardById(id: string) {
    // Try to get from cache first
    const cacheKey = `card:${id}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const card = await Card.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating', 'description'],
        },
      ],
    });

    if (!card) {
      throw new AppError('Card not found', 404);
    }

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(card), { EX: 300 });

    return card;
  }

  /**
   * Create new card (supplier only)
   */
  async createCard(supplierId: string, data: any) {
    const card = await Card.create({
      ...data,
      supplierId,
    });

    return card;
  }

  /**
   * Update card
   */
  async updateCard(id: string, supplierId: string, data: any) {
    const card = await Card.findOne({
      where: { id, supplierId },
    });

    if (!card) {
      throw new AppError('Card not found or unauthorized', 404);
    }

    await card.update(data);

    // Invalidate cache
    await redisClient.del(`card:${id}`);

    return card;
  }

  /**
   * Delete card
   */
  async deleteCard(id: string, supplierId: string) {
    const card = await Card.findOne({
      where: { id, supplierId },
    });

    if (!card) {
      throw new AppError('Card not found or unauthorized', 404);
    }

    await card.destroy();

    // Invalidate cache
    await redisClient.del(`card:${id}`);

    return { message: 'Card deleted successfully' };
  }

  /**
   * Get available stock for a card
   */
  async getCardStock(cardId: string) {
    const count = await CardCode.count({
      where: {
        cardId,
        status: 'available',
      },
    });

    return { cardId, availableStock: count };
  }

  /**
   * Get popular cards
   */
  async getPopularCards(limit: number = 10) {
    const cacheKey = 'popular_cards';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const cards = await Card.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating'],
        },
      ],
      limit,
      order: [['createdAt', 'DESC']],
    });

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(cards), { EX: 3600 });

    return cards;
  }
}

export default new CardService();
