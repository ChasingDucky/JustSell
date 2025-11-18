import express, { Request, Response } from 'express';
import shippingService from '../services/shipping.service';
import addressService from '../services/address.service';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = express.Router();

// Calculate shipping rates
router.post('/calculate-rates', async (req: Request, res: Response) => {
  try {
    const { origin, destination, packageDimensions } = req.body;

    const rates = await shippingService.calculateShippingRates(
      origin,
      destination,
      packageDimensions
    );

    res.json({
      success: true,
      data: rates,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Create shipment
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const shipment = await shippingService.createShipment({
      ...req.body,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: shipment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Track shipment by tracking number
router.get('/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const trackingInfo = await shippingService.trackShipment(trackingNumber);

    res.json({
      success: true,
      data: trackingInfo,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's shipments
router.get('/my-shipments', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const shipments = await shippingService.getUserShipments(userId, status as any);

    res.json({
      success: true,
      data: shipments,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Confirm delivery
router.post('/:id/confirm-delivery', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { signedBy } = req.body;

    const shipment = await shippingService.confirmDelivery(id, userId, signedBy);

    res.json({
      success: true,
      message: 'Delivery confirmed successfully',
      data: shipment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Cancel shipment
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;

    const shipment = await shippingService.cancelShipment(id, userId, reason);

    res.json({
      success: true,
      message: 'Shipment cancelled successfully',
      data: shipment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== ADMIN/SELLER ROUTES =====

// Update shipment status
router.post(
  '/:id/update-status',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, location, description } = req.body;

      const shipment = await shippingService.updateShipmentStatus(
        id,
        status,
        location,
        description
      );

      res.json({
        success: true,
        message: 'Shipment status updated successfully',
        data: shipment,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
