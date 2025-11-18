import { Router } from 'express';
import { query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import searchService from '../services/search.service';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search cards
 *     tags: [Search]
 */
router.get(
  '/',
  validate([
    query('keyword').optional().isString(),
    query('category').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const result = await searchService.search(req.query as any);
    return successResponse(res, 'Search completed', result);
  })
);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 */
router.get(
  '/suggestions',
  validate([
    query('keyword').notEmpty().withMessage('Keyword is required'),
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ]),
  asyncHandler(async (req, res) => {
    const keyword = req.query.keyword as string;
    const limit = parseInt(req.query.limit as string) || 5;
    const suggestions = await searchService.getSuggestions(keyword, limit);
    return successResponse(res, 'Suggestions retrieved', suggestions);
  })
);

/**
 * @swagger
 * /search/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Search]
 */
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await searchService.getCategories();
    return successResponse(res, 'Categories retrieved', categories);
  })
);

/**
 * @swagger
 * /search/trending:
 *   get:
 *     summary: Get trending searches
 *     tags: [Search]
 */
router.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const trending = await searchService.getTrendingSearches(limit);
    return successResponse(res, 'Trending searches retrieved', trending);
  })
);

export default router;
