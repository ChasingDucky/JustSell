import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { Supplier, Card } from '../models';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const suppliers = await Supplier.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'description', 'rating', 'totalSales'],
    });
    return successResponse(res, 'Suppliers retrieved', suppliers);
  })
);

/**
 * @swagger
 * /suppliers/:id:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [
        {
          model: Card,
          as: 'cards',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    return successResponse(res, 'Supplier retrieved', supplier);
  })
);

export default router;
