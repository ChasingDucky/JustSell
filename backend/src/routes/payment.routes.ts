import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import paymentService from '../services/payment.service';
import { successResponse, createdResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create payment for order
 *     tags: [Payments]
 */
router.post(
  '/',
  authenticate,
  validate([
    body('orderId').isUUID().withMessage('Invalid order ID'),
    body('method').notEmpty().withMessage('Payment method is required'),
    body('provider').notEmpty().withMessage('Payment provider is required'),
  ]),
  asyncHandler(async (req: any, res) => {
    const payment = await paymentService.createPayment({
      ...req.body,
      userId: req.user.userId,
    });
    return createdResponse(res, 'Payment created', payment);
  })
);

/**
 * @swagger
 * /payments/:id/stripe:
 *   post:
 *     summary: Process Stripe payment
 *     tags: [Payments]
 */
router.post(
  '/:id/stripe',
  authenticate,
  validate([
    param('id').isUUID(),
    body('token').notEmpty().withMessage('Stripe token is required'),
  ]),
  asyncHandler(async (req, res) => {
    const payment = await paymentService.processStripePayment(req.params.id, req.body.token);
    return successResponse(res, 'Payment processed', payment);
  })
);

/**
 * @swagger
 * /payments/:id/paypal:
 *   post:
 *     summary: Process PayPal payment
 *     tags: [Payments]
 */
router.post(
  '/:id/paypal',
  authenticate,
  validate([
    param('id').isUUID(),
    body('paypalOrderId').notEmpty().withMessage('PayPal order ID is required'),
  ]),
  asyncHandler(async (req, res) => {
    const payment = await paymentService.processPayPalPayment(req.params.id, req.body.paypalOrderId);
    return successResponse(res, 'Payment processed', payment);
  })
);

/**
 * @swagger
 * /payments/:id:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID()]),
  asyncHandler(async (req: any, res) => {
    const payment = await paymentService.getPaymentById(req.params.id, req.user.userId);
    return successResponse(res, 'Payment retrieved', payment);
  })
);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get user payment history
 *     tags: [Payments]
 */
router.get(
  '/',
  authenticate,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req: any, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getUserPayments(req.user.userId, page, limit);
    return successResponse(res, 'Payments retrieved', result);
  })
);

export default router;
