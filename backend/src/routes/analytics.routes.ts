import { Router } from 'express';
import { query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate, authorize } from '../middleware/auth';
import analyticsService from '../services/analytics.service';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const stats = await analyticsService.getDashboardStats();
    return successResponse(res, 'Dashboard stats retrieved', stats);
  })
);

/**
 * @swagger
 * /analytics/sales:
 *   get:
 *     summary: Get sales by date range
 *     tags: [Analytics]
 */
router.get(
  '/sales',
  authenticate,
  authorize('admin'),
  validate([
    query('startDate').isISO8601().withMessage('Invalid start date'),
    query('endDate').isISO8601().withMessage('Invalid end date'),
  ]),
  asyncHandler(async (req, res) => {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const sales = await analyticsService.getSalesByDateRange(startDate, endDate);
    return successResponse(res, 'Sales data retrieved', sales);
  })
);

/**
 * @swagger
 * /analytics/top-cards:
 *   get:
 *     summary: Get top selling cards
 *     tags: [Analytics]
 */
router.get(
  '/top-cards',
  authenticate,
  authorize('admin'),
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('days').optional().isInt({ min: 1 }),
  ]),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 30;
    const topCards = await analyticsService.getTopSellingCards(limit, days);
    return successResponse(res, 'Top selling cards retrieved', topCards);
  })
);

/**
 * @swagger
 * /analytics/revenue-by-category:
 *   get:
 *     summary: Get revenue by category
 *     tags: [Analytics]
 */
router.get(
  '/revenue-by-category',
  authenticate,
  authorize('admin'),
  validate([query('days').optional().isInt({ min: 1 })]),
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const revenue = await analyticsService.getRevenueByCategory(days);
    return successResponse(res, 'Revenue by category retrieved', revenue);
  })
);

/**
 * @swagger
 * /analytics/customer-insights:
 *   get:
 *     summary: Get customer insights
 *     tags: [Analytics]
 */
router.get(
  '/customer-insights',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const insights = await analyticsService.getCustomerInsights();
    return successResponse(res, 'Customer insights retrieved', insights);
  })
);

/**
 * @swagger
 * /analytics/supplier-performance:
 *   get:
 *     summary: Get supplier performance
 *     tags: [Analytics]
 */
router.get(
  '/supplier-performance',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const performance = await analyticsService.getSupplierPerformance(limit);
    return successResponse(res, 'Supplier performance retrieved', performance);
  })
);

export default router;
