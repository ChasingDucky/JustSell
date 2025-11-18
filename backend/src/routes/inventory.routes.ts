import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate, authorize } from '../middleware/auth';
import inventoryService from '../services/inventory.service';
import { successResponse, createdResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /inventory/:cardId/status:
 *   get:
 *     summary: Get inventory status for a card
 *     tags: [Inventory]
 */
router.get(
  '/:cardId/status',
  authenticate,
  authorize('supplier', 'admin'),
  validate([param('cardId').isUUID()]),
  asyncHandler(async (req, res) => {
    const status = await inventoryService.getInventoryStatus(req.params.cardId);
    return successResponse(res, 'Inventory status retrieved', status);
  })
);

/**
 * @swagger
 * /inventory/add-codes:
 *   post:
 *     summary: Add card codes to inventory
 *     tags: [Inventory]
 */
router.post(
  '/add-codes',
  authenticate,
  authorize('supplier', 'admin'),
  validate([
    body('cardId').isUUID().withMessage('Invalid card ID'),
    body('codes').isArray({ min: 1 }).withMessage('Codes array is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { cardId, codes } = req.body;
    const result = await inventoryService.addCardCodes(cardId, codes);
    return createdResponse(res, 'Card codes added', result);
  })
);

/**
 * @swagger
 * /inventory/generate-codes:
 *   post:
 *     summary: Generate random card codes
 *     tags: [Inventory]
 */
router.post(
  '/generate-codes',
  authenticate,
  authorize('supplier', 'admin'),
  validate([
    body('cardId').isUUID(),
    body('count').isInt({ min: 1, max: 1000 }),
  ]),
  asyncHandler(async (req, res) => {
    const { cardId, count } = req.body;
    const result = await inventoryService.generateCardCodes(cardId, count);
    return createdResponse(res, 'Card codes generated', result);
  })
);

/**
 * @swagger
 * /inventory/expiring:
 *   get:
 *     summary: Get expiring cards
 *     tags: [Inventory]
 */
router.get(
  '/expiring',
  authenticate,
  authorize('supplier', 'admin'),
  validate([query('days').optional().isInt({ min: 1 })]),
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const expiring = await inventoryService.getExpiringCards(days);
    return successResponse(res, 'Expiring cards retrieved', expiring);
  })
);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Inventory]
 */
router.get(
  '/low-stock',
  authenticate,
  authorize('supplier', 'admin'),
  validate([query('threshold').optional().isInt({ min: 1 })]),
  asyncHandler(async (req, res) => {
    const threshold = parseInt(req.query.threshold as string) || 10;
    const lowStock = await inventoryService.getLowStockAlerts(threshold);
    return successResponse(res, 'Low stock alerts retrieved', lowStock);
  })
);

export default router;
