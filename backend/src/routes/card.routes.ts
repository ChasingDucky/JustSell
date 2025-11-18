import { Router } from 'express';
import { query, body, param } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate, authorize } from '../middleware/auth';
import cardService from '../services/card.service';
import { successResponse, createdResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Get all cards with filters
 *     tags: [Cards]
 */
router.get(
  '/',
  validate([
    query('category').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const result = await cardService.getCards(req.query as any);
    return successResponse(res, 'Cards retrieved successfully', result);
  })
);

/**
 * @swagger
 * /cards/popular:
 *   get:
 *     summary: Get popular cards
 *     tags: [Cards]
 */
router.get(
  '/popular',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const cards = await cardService.getPopularCards(limit);
    return successResponse(res, 'Popular cards retrieved', cards);
  })
);

/**
 * @swagger
 * /cards/:id:
 *   get:
 *     summary: Get card by ID
 *     tags: [Cards]
 */
router.get(
  '/:id',
  validate([param('id').isUUID()]),
  asyncHandler(async (req, res) => {
    const card = await cardService.getCardById(req.params.id);
    return successResponse(res, 'Card retrieved successfully', card);
  })
);

/**
 * @swagger
 * /cards/:id/stock:
 *   get:
 *     summary: Get card stock
 *     tags: [Cards]
 */
router.get(
  '/:id/stock',
  validate([param('id').isUUID()]),
  asyncHandler(async (req, res) => {
    const stock = await cardService.getCardStock(req.params.id);
    return successResponse(res, 'Stock retrieved', stock);
  })
);

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: Create new card (supplier only)
 *     tags: [Cards]
 */
router.post(
  '/',
  authenticate,
  authorize('supplier', 'admin'),
  validate([
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('denomination').isFloat({ min: 0 }).withMessage('Invalid denomination'),
    body('price').isFloat({ min: 0 }).withMessage('Invalid price'),
  ]),
  asyncHandler(async (req: any, res) => {
    const card = await cardService.createCard(req.user.userId, req.body);
    return createdResponse(res, 'Card created successfully', card);
  })
);

/**
 * @swagger
 * /cards/:id:
 *   put:
 *     summary: Update card
 *     tags: [Cards]
 */
router.put(
  '/:id',
  authenticate,
  authorize('supplier', 'admin'),
  validate([param('id').isUUID()]),
  asyncHandler(async (req: any, res) => {
    const card = await cardService.updateCard(req.params.id, req.user.userId, req.body);
    return successResponse(res, 'Card updated successfully', card);
  })
);

/**
 * @swagger
 * /cards/:id:
 *   delete:
 *     summary: Delete card
 *     tags: [Cards]
 */
router.delete(
  '/:id',
  authenticate,
  authorize('supplier', 'admin'),
  validate([param('id').isUUID()]),
  asyncHandler(async (req: any, res) => {
    const result = await cardService.deleteCard(req.params.id, req.user.userId);
    return successResponse(res, 'Card deleted successfully', result);
  })
);

export default router;
