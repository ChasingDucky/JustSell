import { Payment, Order } from '../models';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';
import orderService from './order.service';

export class PaymentService {
  /**
   * Create payment for order
   */
  async createPayment(data: {
    orderId: string;
    userId: string;
    method: string;
    provider: string;
  }) {
    const order = await Order.findOne({
      where: { id: data.orderId, userId: data.userId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'pending') {
      throw new AppError('Order is not in pending status', 400);
    }

    const payment = await Payment.create({
      orderId: data.orderId,
      userId: data.userId,
      amount: order.finalAmount,
      currency: order.currency,
      method: data.method,
      provider: data.provider,
      status: 'pending',
    });

    return payment;
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(paymentId: string, stripeToken: string) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    try {
      // Here you would integrate with Stripe API
      // const stripe = require('stripe')(config.payment.stripe.secretKey);
      // const charge = await stripe.charges.create({...});

      // Simulated payment success
      await payment.update({
        status: 'completed',
        transactionId: `stripe_${Date.now()}`,
        processedAt: new Date(),
        metadata: { stripeToken },
      });

      // Update order status
      await orderService.updateOrderStatus(payment.orderId, 'paid');

      return payment;
    } catch (error: any) {
      await payment.update({
        status: 'failed',
        errorMessage: error.message,
      });
      throw new AppError('Payment processing failed', 400);
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(paymentId: string, paypalOrderId: string) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    try {
      // Here you would integrate with PayPal API
      // Simulated payment success
      await payment.update({
        status: 'completed',
        transactionId: paypalOrderId,
        processedAt: new Date(),
      });

      await orderService.updateOrderStatus(payment.orderId, 'paid');

      return payment;
    } catch (error: any) {
      await payment.update({
        status: 'failed',
        errorMessage: error.message,
      });
      throw new AppError('Payment processing failed', 400);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string, userId?: string) {
    const where: any = { id: paymentId };
    if (userId) {
      where.userId = userId;
    }

    const payment = await Payment.findOne({ where });
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== 'completed') {
      throw new AppError('Only completed payments can be refunded', 400);
    }

    // Process refund with payment provider
    // This would call the actual payment provider's refund API

    await payment.update({
      status: 'refunded',
      refundedAt: new Date(),
    });

    // Update order status
    await orderService.updateOrderStatus(payment.orderId, 'refunded');

    return payment;
  }

  /**
   * Get payment history for user
   */
  async getUserPayments(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Payment.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'totalAmount'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      payments: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default new PaymentService();
