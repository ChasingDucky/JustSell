import { Op } from 'sequelize';
import { Order, Card, Payment, User, Supplier } from '../models';
import { sequelize } from '../config/database';
import { redisClient } from '../config/redis';

export class AnalyticsService {
  /**
   * Get dashboard overview
   */
  async getDashboardStats() {
    const cacheKey = 'dashboard_stats';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalCards,
      completedOrders,
      pendingOrders,
    ] = await Promise.all([
      Order.count(),
      Order.sum('finalAmount', { where: { status: 'completed' } }),
      User.count(),
      Card.count({ where: { status: 'active' } }),
      Order.count({ where: { status: 'completed' } }),
      Order.count({ where: { status: 'pending' } }),
    ]);

    const stats = {
      totalOrders,
      totalRevenue: totalRevenue || 0,
      totalUsers,
      totalCards,
      completedOrders,
      pendingOrders,
    };

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), { EX: 300 });

    return stats;
  }

  /**
   * Get sales by date range
   */
  async getSalesByDateRange(startDate: Date, endDate: Date) {
    const sales = await Order.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'revenue'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return sales;
  }

  /**
   * Get top selling cards
   */
  async getTopSellingCards(limit: number = 10, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topCards = await Order.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        'cardId',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'salesCount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalRevenue'],
      ],
      include: [
        {
          model: Card,
          as: 'card',
          attributes: ['id', 'name', 'category', 'price'],
        },
      ],
      group: ['cardId', 'card.id'],
      order: [[sequelize.literal('salesCount'), 'DESC']],
      limit,
      raw: false,
    });

    return topCards;
  }

  /**
   * Get revenue by category
   */
  async getRevenueByCategory(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueByCategory = await Order.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'revenue'],
      ],
      include: [
        {
          model: Card,
          as: 'card',
          attributes: ['category'],
        },
      ],
      group: ['card.category'],
      raw: true,
    });

    return revenueByCategory;
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights() {
    const [
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      repeatCustomers,
    ] = await Promise.all([
      User.count({ where: { role: 'customer' } }),
      User.count({ where: { role: 'customer', status: 'active' } }),
      User.count({
        where: {
          role: 'customer',
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      sequelize.query(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM orders
         GROUP BY user_id
         HAVING COUNT(*) > 1`,
        { type: sequelize.QueryTypes.SELECT }
      ).then((results: any) => results.length),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      repeatCustomers,
    };
  }

  /**
   * Get supplier performance
   */
  async getSupplierPerformance(limit: number = 10) {
    const suppliers = await Supplier.findAll({
      attributes: [
        'id',
        'name',
        'rating',
        'totalSales',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM orders
            INNER JOIN cards ON orders.card_id = cards.id
            WHERE cards.supplier_id = Supplier.id
            AND orders.status = 'completed'
          )`),
          'orderCount',
        ],
        [
          sequelize.literal(`(
            SELECT SUM(final_amount)
            FROM orders
            INNER JOIN cards ON orders.card_id = cards.id
            WHERE cards.supplier_id = Supplier.id
            AND orders.status = 'completed'
          )`),
          'revenue',
        ],
      ],
      order: [[sequelize.literal('revenue'), 'DESC NULLS LAST']],
      limit,
      raw: true,
    });

    return suppliers;
  }

  /**
   * Get payment method statistics
   */
  async getPaymentMethodStats() {
    const stats = await Payment.findAll({
      where: { status: 'completed' },
      attributes: [
        'provider',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      group: ['provider'],
      raw: true,
    });

    return stats;
  }

  /**
   * Get user activity trends
   */
  async getUserActivityTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activity = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'activeUsers'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return activity;
  }

  /**
   * Export analytics report
   */
  async exportAnalyticsReport(startDate: Date, endDate: Date) {
    const [
      salesData,
      topCards,
      revenueByCategory,
      paymentStats,
    ] = await Promise.all([
      this.getSalesByDateRange(startDate, endDate),
      this.getTopSellingCards(20),
      this.getRevenueByCategory(),
      this.getPaymentMethodStats(),
    ]);

    return {
      period: { startDate, endDate },
      salesData,
      topCards,
      revenueByCategory,
      paymentStats,
      generatedAt: new Date(),
    };
  }
}

export default new AnalyticsService();
