import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate, authorize } from '../middleware/auth';
import orderService from '../services/order.service';
import { successResponse, createdResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 */
router.post(
  '/',
  authenticate,
  validate([
    body('cardId').isUUID().withMessage('Invalid card ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
    body('deliveryEmail').optional().isEmail(),
    body('deliveryPhone').optional().isString(),
  ]),
  asyncHandler(async (req: any, res) => {
    const order = await orderService.createOrder(req.user.userId, req.body);
    return createdResponse(res, 'Order created successfully', order);
  })
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
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
    const result = await orderService.getUserOrders(req.user.userId, page, limit);
    return successResponse(res, 'Orders retrieved', result);
  })
);

/**
 * @swagger
 * /orders/:id:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID()]),
  asyncHandler(async (req: any, res) => {
    const order = await orderService.getOrderById(req.params.id, req.user.userId);
    return successResponse(res, 'Order retrieved', order);
  })
);

/**
 * @swagger
 * /orders/:id/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate([param('id').isUUID()]),
  asyncHandler(async (req: any, res) => {
    const result = await orderService.cancelOrder(req.params.id, req.user.userId);
    return successResponse(res, 'Order cancelled', result);
  })
);

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Get user order statistics
 *     tags: [Orders]
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const stats = await orderService.getUserOrderStats(req.user.userId);
    return successResponse(res, 'Stats retrieved', stats);
  })
);

export default router;
