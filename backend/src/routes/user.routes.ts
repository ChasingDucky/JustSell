import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { User } from '../models';
import { successResponse } from '../utils/response';
import { hashPassword } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 */
router.put(
  '/profile',
  authenticate,
  validate([
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('phone').optional().isString(),
  ]),
  asyncHandler(async (req: any, res) => {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update(req.body);
    return successResponse(res, 'Profile updated successfully', user);
  })
);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Users]
 */
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ]),
  asyncHandler(async (req: any, res) => {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newPasswordHash = await hashPassword(req.body.newPassword);
    await user.update({ password: newPasswordHash });

    return successResponse(res, 'Password changed successfully');
  })
);

export default router;
