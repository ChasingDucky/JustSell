import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import enhancedPaymentService from '../services/payment.service.enhanced';
import { successResponse, createdResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /payments/methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [Payments]
 */
router.get(
  '/methods',
  asyncHandler(async (req, res) => {
    const methods = await enhancedPaymentService.getAvailablePaymentMethods();
    return successResponse(res, 'Payment methods retrieved', methods);
  })
);

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create payment for order with gateway integration
 *     tags: [Payments]
 */
router.post(
  '/',
  authenticate,
  validate([
    body('orderId').isUUID().withMessage('Invalid order ID'),
    body('method').notEmpty().withMessage('Payment method is required'),
    body('provider').isIn(['stripe', 'paypal', 'alipay', 'wechat']).withMessage('Invalid payment provider'),
    body('returnUrl').optional().isURL().withMessage('Invalid return URL'),
    body('cancelUrl').optional().isURL().withMessage('Invalid cancel URL'),
  ]),
  asyncHandler(async (req: any, res) => {
    const result = await enhancedPaymentService.createPayment({
      ...req.body,
      userId: req.user.id,
    });
    return createdResponse(res, 'Payment created', result);
  })
);

/**
 * @swagger
 * /payments/:id/process:
 *   post:
 *     summary: Process/confirm payment
 *     tags: [Payments]
 */
router.post(
  '/:id/process',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Invalid payment ID'),
    body('token').optional().isString(),
    body('paymentMethodId').optional().isString(),
    body('metadata').optional().isObject(),
  ]),
  asyncHandler(async (req, res) => {
    const payment = await enhancedPaymentService.processPayment(req.params.id, req.body);
    return successResponse(res, 'Payment processed', payment);
  })
);

/**
 * @swagger
 * /payments/webhook/:provider:
 *   post:
 *     summary: Handle payment provider webhook/callback
 *     tags: [Payments]
 */
router.post(
  '/webhook/:provider',
  validate([
    param('provider').isIn(['stripe', 'paypal', 'alipay', 'wechat']).withMessage('Invalid provider'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await enhancedPaymentService.handlePaymentCallback(
      req.params.provider,
      {
        ...req.body,
        headers: req.headers,
        rawBody: req.body,
      }
    );
    return successResponse(res, 'Callback processed', result);
  })
);

/**
 * @swagger
 * /payments/:id/refund:
 *   post:
 *     summary: Refund payment
 *     tags: [Payments]
 */
router.post(
  '/:id/refund',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Invalid payment ID'),
    body('reason').optional().isString(),
  ]),
  asyncHandler(async (req: any, res) => {
    const payment = await enhancedPaymentService.refundPayment(req.params.id, req.body.reason);
    return successResponse(res, 'Payment refunded', payment);
  })
);

/**
 * @swagger
 * /payments/:id:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Invalid payment ID')]),
  asyncHandler(async (req: any, res) => {
    const payment = await enhancedPaymentService.getPaymentById(req.params.id, req.user.id);
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
    const result = await enhancedPaymentService.getUserPayments(req.user.id, page, limit);
    return successResponse(res, 'Payments retrieved', result);
  })
);

export default router;
