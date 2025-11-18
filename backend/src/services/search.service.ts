import { Op } from 'sequelize';
import { Card, Supplier } from '../models';
import { redisClient } from '../config/redis';

export class SearchService {
  /**
   * Advanced search with multiple criteria
   */
  async search(query: {
    keyword?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    tags?: string[];
    supplierId?: string;
    minRating?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      minDiscount,
      tags,
      supplierId,
      minRating,
      page = 1,
      limit = 20,
    } = query;

    const where: any = { status: 'active' };
    const supplierWhere: any = { status: 'active' };

    // Keyword search
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price[Op.gte] = minPrice;
      if (maxPrice !== undefined) where.price[Op.lte] = maxPrice;
    }

    // Minimum discount
    if (minDiscount !== undefined) {
      where.discount = { [Op.gte]: minDiscount };
    }

    // Tags
    if (tags && tags.length > 0) {
      where.tags = { [Op.overlap]: tags };
    }

    // Supplier
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Supplier rating
    if (minRating !== undefined) {
      supplierWhere.rating = { [Op.gte]: minRating };
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Card.findAndCountAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating', 'totalSales'],
          where: supplierWhere,
        },
      ],
      limit,
      offset,
      order: [
        ['discount', 'DESC'],
        ['price', 'ASC'],
      ],
    });

    return {
      results: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(keyword: string, limit: number = 5) {
    const cacheKey = `suggestions:${keyword.toLowerCase()}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const cards = await Card.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { name: { [Op.iLike]: `%${keyword}%` } },
          { tags: { [Op.overlap]: [keyword.toLowerCase()] } },
        ],
      },
      attributes: ['id', 'name', 'category', 'price'],
      limit,
    });

    const suggestions = cards.map((card) => ({
      id: card.id,
      name: card.name,
      category: card.category,
      price: card.price,
    }));

    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(suggestions), { EX: 600 });

    return suggestions;
  }

  /**
   * Get all available categories
   */
  async getCategories() {
    const cacheKey = 'categories';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await Card.findAll({
      attributes: ['category'],
      group: ['category'],
      where: { status: 'active' },
    });

    const result = categories.map((c) => c.category);

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 3600 });

    return result;
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit: number = 10) {
    // This would typically track user searches in Redis
    // For now, return popular categories/tags
    const cacheKey = 'trending_searches';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Placeholder implementation
    const trending = [
      'Steam Card',
      'PlayStation',
      'Netflix',
      'Mobile Recharge',
      'Xbox',
      'iTunes',
      'Google Play',
      'Amazon',
    ].slice(0, limit);

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(trending), { EX: 3600 });

    return trending;
  }
}

export default new SearchService();
