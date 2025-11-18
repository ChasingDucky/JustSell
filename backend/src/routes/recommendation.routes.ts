import { Router } from 'express';
import { query, param } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { optionalAuth } from '../middleware/auth';
import recommendationService from '../services/recommendation.service';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /recommendations/personalized:
 *   get:
 *     summary: Get personalized recommendations
 *     tags: [Recommendations]
 */
router.get(
  '/personalized',
  optionalAuth,
  asyncHandler(async (req: any, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user?.userId;

    if (!userId) {
      return successResponse(res, 'Please login for personalized recommendations', []);
    }

    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);
    return successResponse(res, 'Recommendations retrieved', recommendations);
  })
);

/**
 * @swagger
 * /recommendations/deals:
 *   get:
 *     summary: Get best deals
 *     tags: [Recommendations]
 */
router.get(
  '/deals',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const deals = await recommendationService.getBestDeals(limit);
    return successResponse(res, 'Best deals retrieved', deals);
  })
);

/**
 * @swagger
 * /recommendations/trending:
 *   get:
 *     summary: Get trending cards
 *     tags: [Recommendations]
 */
router.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const trending = await recommendationService.getTrendingCards(limit);
    return successResponse(res, 'Trending cards retrieved', trending);
  })
);

/**
 * @swagger
 * /recommendations/similar/:cardId:
 *   get:
 *     summary: Get similar cards
 *     tags: [Recommendations]
 */
router.get(
  '/similar/:cardId',
  validate([param('cardId').isUUID()]),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const similar = await recommendationService.getSimilarCards(req.params.cardId, limit);
    return successResponse(res, 'Similar cards retrieved', similar);
  })
);

/**
 * @swagger
 * /recommendations/compare:
 *   get:
 *     summary: Get price comparison
 *     tags: [Recommendations]
 */
router.get(
  '/compare',
  validate([
    query('category').notEmpty().withMessage('Category is required'),
    query('denomination').isFloat({ min: 0 }).withMessage('Invalid denomination'),
  ]),
  asyncHandler(async (req, res) => {
    const { category, denomination } = req.query;
    const cards = await recommendationService.getPriceComparison(
      category as string,
      parseFloat(denomination as string)
    );
    return successResponse(res, 'Price comparison retrieved', cards);
  })
);

export default router;
