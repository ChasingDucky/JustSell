import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import authService from '../services/auth.service';
import { successResponse, createdResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post(
  '/register',
  authRateLimiter,
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return createdResponse(res, 'User registered successfully', result);
  })
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post(
  '/login',
  authRateLimiter,
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, 'Login successful', result);
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const result = await authService.logout(req.user.userId);
    return successResponse(res, 'Logout successful', result);
  })
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post(
  '/refresh',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const result = await authService.refreshToken(req.user.userId);
    return successResponse(res, 'Token refreshed', result);
  })
);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const profile = await authService.getProfile(req.user.userId);
    return successResponse(res, 'Profile retrieved', profile);
  })
);

export default router;
