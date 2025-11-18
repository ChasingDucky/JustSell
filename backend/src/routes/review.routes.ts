import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import reviewService from '../services/review.service';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /reviews/card/{cardId}:
 *   get:
 *     summary: Get reviews for a card
 *     tags: [Reviews]
 */
router.get(
  '/card/:cardId',
  validate([
    param('cardId').isUUID().withMessage('Invalid card ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getCardReviews(cardId, page, limit);
    return successResponse(res, 'Card reviews retrieved', result);
  })
);

/**
 * @swagger
 * /reviews/card/{cardId}/stats:
 *   get:
 *     summary: Get review statistics for a card
 *     tags: [Reviews]
 */
router.get(
  '/card/:cardId/stats',
  validate([param('cardId').isUUID().withMessage('Invalid card ID')]),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const stats = await reviewService.getCardReviewStats(cardId);
    return successResponse(res, 'Review statistics retrieved', stats);
  })
);

/**
 * @swagger
 * /reviews/user:
 *   get:
 *     summary: Get user's reviews
 *     tags: [Reviews]
 */
router.get(
  '/user',
  authenticate,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getUserReviews(userId, page, limit);
    return successResponse(res, 'User reviews retrieved', result);
  })
);

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid review ID')]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);
    return successResponse(res, 'Review retrieved', review);
  })
);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 */
router.post(
  '/',
  authenticate,
  validate([
    body('cardId').isUUID().withMessage('Invalid card ID'),
    body('orderId').optional().isUUID().withMessage('Invalid order ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').optional().isString().isLength({ max: 200 }),
    body('comment').optional().isString().isLength({ max: 2000 }),
  ]),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { cardId, orderId, rating, title, comment } = req.body;

    const review = await reviewService.createReview({
      userId,
      cardId,
      orderId,
      rating,
      title,
      comment,
    });

    return successResponse(res, 'Review created successfully', review, 201);
  })
);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 */
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('title').optional().isString().isLength({ max: 200 }),
    body('comment').optional().isString().isLength({ max: 2000 }),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { rating, title, comment } = req.body;

    const review = await reviewService.updateReview(id, userId, {
      rating,
      title,
      comment,
    });

    return successResponse(res, 'Review updated successfully', review);
  })
);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 */
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Invalid review ID')]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    await reviewService.deleteReview(id, userId);

    return successResponse(res, 'Review deleted successfully');
  })
);

/**
 * @swagger
 * /reviews/{id}/helpful:
 *   post:
 *     summary: Mark review as helpful
 *     tags: [Reviews]
 */
router.post(
  '/:id/helpful',
  validate([param('id').isUUID().withMessage('Invalid review ID')]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.markHelpful(id);
    return successResponse(res, 'Review marked as helpful', review);
  })
);

export default router;
