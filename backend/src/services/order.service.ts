import { Order, Card, CardCode, User, Payment } from '../models';
import { AppError } from '../middleware/errorHandler';
import { encryptCard } from '../utils/encryption';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import notificationService from './notification.service';

export class OrderService {
  /**
   * Create new order
   */
  async createOrder(userId: string, data: {
    cardId: string;
    quantity: number;
    deliveryEmail?: string;
    deliveryPhone?: string;
    deliveryMethod?: 'email' | 'sms' | 'app';
    notes?: string;
  }) {
    const transaction = await sequelize.transaction();

    try {
      // Get card details
      const card = await Card.findByPk(data.cardId);
      if (!card) {
        throw new AppError('Card not found', 404);
      }

      if (card.status !== 'active') {
        throw new AppError('Card is not available', 400);
      }

      // Check quantity limits
      if (data.quantity < card.minPurchase || data.quantity > card.maxPurchase) {
        throw new AppError(
          `Quantity must be between ${card.minPurchase} and ${card.maxPurchase}`,
          400
        );
      }

      // Check stock availability
      const availableStock = await CardCode.count({
        where: {
          cardId: data.cardId,
          status: 'available',
        },
        transaction,
      });

      if (availableStock < data.quantity) {
        throw new AppError('Insufficient stock', 400);
      }

      // Calculate pricing
      const unitPrice = parseFloat(card.price.toString());
      const totalAmount = unitPrice * data.quantity;
      const discount = (parseFloat(card.discount.toString()) / 100) * totalAmount;
      const finalAmount = totalAmount - discount;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create order
      const order = await Order.create(
        {
          orderNumber,
          userId,
          cardId: data.cardId,
          quantity: data.quantity,
          unitPrice,
          totalAmount,
          discount,
          finalAmount,
          currency: card.currency,
          status: 'pending',
          deliveryEmail: data.deliveryEmail,
          deliveryPhone: data.deliveryPhone,
          deliveryMethod: data.deliveryMethod || 'email',
          notes: data.notes,
        },
        { transaction }
      );

      // Reserve card codes
      const cardCodes = await CardCode.findAll({
        where: {
          cardId: data.cardId,
          status: 'available',
        },
        limit: data.quantity,
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      await Promise.all(
        cardCodes.map((code) =>
          code.update(
            {
              status: 'reserved',
              orderId: order.id,
              reservedAt: new Date(),
            },
            { transaction }
          )
        )
      );

      await transaction.commit();

      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Card,
          as: 'card',
          attributes: ['id', 'name', 'category', 'imageUrl'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      orders: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }

    const order = await Order.findOne({
      where,
      include: [
        {
          model: Card,
          as: 'card',
        },
        {
          model: CardCode,
          as: 'cardCodes',
          attributes: ['id', 'code', 'pin', 'status'],
        },
        {
          model: Payment,
          as: 'payments',
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: Order['status']) {
    const order = await Order.findByPk(orderId, {
      include: [{ model: User, as: 'user' }]
    });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    await order.update({ status });

    if (status === 'completed') {
      await order.update({ completedAt: new Date() });

      // Mark card codes as sold
      await CardCode.update(
        { status: 'sold', soldAt: new Date() },
        { where: { orderId, status: 'reserved' } }
      );

      // Send card codes to customer
      await this.deliverCardCodes(orderId);
    } else if (status === 'cancelled') {
      await order.update({ cancelledAt: new Date() });

      // Release reserved card codes
      await CardCode.update(
        { status: 'available', orderId: null, reservedAt: null },
        { where: { orderId, status: 'reserved' } }
      );

      // Send cancellation notification
      if (order.user) {
        await notificationService.sendOrderCancellation(order, order.user).catch(err =>
          console.error('Failed to send cancellation email:', err)
        );
      }
    } else if (status === 'paid') {
      // Send payment confirmation
      if (order.user) {
        await notificationService.sendPaymentConfirmation(order, order.user).catch(err =>
          console.error('Failed to send payment confirmation:', err)
        );
      }
    }

    return order;
  }

  /**
   * Deliver card codes to customer
   */
  async deliverCardCodes(orderId: string) {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'user' },
        { model: CardCode, as: 'cardCodes' }
      ]
    });

    if (!order || !order.user) {
      throw new AppError('Order or user not found', 404);
    }

    const cardCodes = await CardCode.findAll({
      where: { orderId, status: 'sold' }
    });

    if (cardCodes.length === 0) {
      return;
    }

    // Send via selected delivery method
    try {
      if (order.deliveryMethod === 'email' && order.deliveryEmail) {
        await notificationService.sendCardCodesEmail(order, order.user, cardCodes);
      } else if (order.deliveryMethod === 'sms' && order.deliveryPhone) {
        await notificationService.sendCardCodesSMS(order.deliveryPhone, order, cardCodes);
      }
      // For 'app' delivery, codes are just stored in the order and accessible through the app
    } catch (error) {
      console.error('Failed to deliver card codes:', error);
      // Don't throw error, just log it - codes can still be accessed through the order
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new AppError('Cannot cancel this order', 400);
    }

    await this.updateOrderStatus(orderId, 'cancelled');

    return { message: 'Order cancelled successfully' };
  }

  /**
   * Get order statistics for user
   */
  async getUserOrderStats(userId: string) {
    const totalOrders = await Order.count({ where: { userId } });
    const completedOrders = await Order.count({
      where: { userId, status: 'completed' }
    });
    const pendingOrders = await Order.count({
      where: { userId, status: 'pending' }
    });

    const totalSpent = await Order.sum('finalAmount', {
      where: { userId, status: 'completed' },
    });

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      totalSpent: totalSpent || 0,
    };
  }
}

export default new OrderService();
