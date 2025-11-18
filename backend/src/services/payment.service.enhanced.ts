import { Payment, Order } from '../models';
import { AppError } from '../middleware/errorHandler';
import orderService from './order.service';
import { PaymentGatewayFactory } from './payment/PaymentGatewayFactory';
import logger from '../utils/logger';

export class EnhancedPaymentService {
  /**
   * Create payment intent with payment gateway
   */
  async createPayment(data: {
    orderId: string;
    userId: string;
    method: string;
    provider: string;
    returnUrl?: string;
    cancelUrl?: string;
  }) {
    // Validate order
    const order = await Order.findOne({
      where: { id: data.orderId, userId: data.userId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'pending') {
      throw new AppError('Order is not in pending status', 400);
    }

    // Check if provider is supported
    if (!PaymentGatewayFactory.isProviderSupported(data.provider)) {
      throw new AppError(`Payment provider ${data.provider} is not supported`, 400);
    }

    // Create payment record
    const payment = await Payment.create({
      orderId: data.orderId,
      userId: data.userId,
      amount: order.finalAmount,
      currency: order.currency,
      method: data.method,
      provider: data.provider,
      status: 'pending',
    });

    try {
      // Get payment gateway
      const gateway = PaymentGatewayFactory.getGateway(data.provider);

      // Create payment with gateway
      const result = await gateway.createPayment({
        amount: order.finalAmount,
        currency: order.currency,
        orderId: order.id,
        description: `Order ${order.orderNumber}`,
        metadata: {
          paymentId: payment.id,
          userId: data.userId,
        },
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
      });

      if (!result.success) {
        throw new Error(result.errorMessage || 'Payment creation failed');
      }

      // Update payment with gateway response
      await payment.update({
        transactionId: result.transactionId,
        status: result.status as any,
        metadata: {
          ...payment.metadata,
          ...result.metadata,
          paymentUrl: result.paymentUrl,
          clientSecret: result.clientSecret,
          qrCode: result.qrCode,
        },
      });

      logger.info(`Payment created: ${payment.id} for order ${order.id}`);

      return {
        payment,
        paymentUrl: result.paymentUrl,
        clientSecret: result.clientSecret,
        qrCode: result.qrCode,
      };
    } catch (error: any) {
      logger.error('Payment creation failed:', error);
      await payment.update({
        status: 'failed',
        errorMessage: error.message,
      });
      throw new AppError(`Payment creation failed: ${error.message}`, 400);
    }
  }

  /**
   * Process payment (confirm/capture)
   */
  async processPayment(paymentId: string, data?: {
    token?: string;
    paymentMethodId?: string;
    metadata?: Record<string, any>;
  }) {
    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Order, as: 'order' }],
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status === 'completed') {
      throw new AppError('Payment already completed', 400);
    }

    try {
      // Get payment gateway
      const gateway = PaymentGatewayFactory.getGateway(payment.provider);

      // Process payment
      const result = await gateway.processPayment({
        paymentId: payment.transactionId || payment.id,
        token: data?.token,
        paymentMethodId: data?.paymentMethodId,
        metadata: data?.metadata,
      });

      if (!result.success) {
        throw new Error(result.errorMessage || 'Payment processing failed');
      }

      // Update payment status
      await payment.update({
        status: result.status as any,
        transactionId: result.transactionId || payment.transactionId,
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          ...result.metadata,
        },
      });

      // Update order if payment completed
      if (result.status === 'completed') {
        await orderService.updateOrderStatus(payment.orderId, 'paid');
        logger.info(`Payment completed: ${payment.id} for order ${payment.orderId}`);
      }

      return payment;
    } catch (error: any) {
      logger.error('Payment processing failed:', error);
      await payment.update({
        status: 'failed',
        errorMessage: error.message,
      });
      throw new AppError(`Payment processing failed: ${error.message}`, 400);
    }
  }

  /**
   * Handle payment callback/webhook
   */
  async handlePaymentCallback(provider: string, callbackData: any) {
    try {
      // Get payment gateway
      const gateway = PaymentGatewayFactory.getGateway(provider);

      // Verify callback
      const verification = await gateway.verifyCallback(callbackData);

      if (!verification.valid) {
        throw new Error('Invalid callback signature');
      }

      // Find payment by transaction ID
      const payment = await Payment.findOne({
        where: { transactionId: verification.transactionId },
      });

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${verification.transactionId}`);
        return { success: false, message: 'Payment not found' };
      }

      // Update payment status
      await payment.update({
        status: verification.status as any,
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          ...verification.metadata,
        },
      });

      // Update order if payment completed
      if (verification.status === 'completed') {
        await orderService.updateOrderStatus(payment.orderId, 'paid');
        logger.info(`Payment callback processed: ${payment.id} - Status: ${verification.status}`);
      }

      return { success: true, payment };
    } catch (error: any) {
      logger.error('Payment callback handling failed:', error);
      throw new AppError(`Callback handling failed: ${error.message}`, 400);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, reason?: string) {
    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== 'completed') {
      throw new AppError('Only completed payments can be refunded', 400);
    }

    if (payment.status === 'refunded') {
      throw new AppError('Payment already refunded', 400);
    }

    try {
      // Get payment gateway
      const gateway = PaymentGatewayFactory.getGateway(payment.provider);

      // Process refund
      const result = await gateway.refundPayment(
        payment.transactionId!,
        payment.amount
      );

      if (!result.success) {
        throw new Error(result.errorMessage || 'Refund failed');
      }

      // Update payment
      await payment.update({
        status: 'refunded',
        refundedAt: new Date(),
        metadata: {
          ...payment.metadata,
          refundId: result.refundId,
          refundReason: reason,
        },
      });

      // Update order
      await orderService.updateOrderStatus(payment.orderId, 'refunded');

      logger.info(`Payment refunded: ${payment.id}`);

      return payment;
    } catch (error: any) {
      logger.error('Payment refund failed:', error);
      throw new AppError(`Refund failed: ${error.message}`, 400);
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

    const payment = await Payment.findOne({
      where,
      include: [{ model: Order, as: 'order' }],
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  /**
   * Get user payment history
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

  /**
   * Get available payment methods
   */
  async getAvailablePaymentMethods() {
    return PaymentGatewayFactory.getPaymentMethodsConfig();
  }
}

export default new EnhancedPaymentService();
