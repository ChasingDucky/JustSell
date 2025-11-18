import express, { Request, Response } from 'express';
import escrowService from '../services/escrow.service';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import sellerService from '../services/seller.service';

const router = express.Router();

// Get escrow by order ID
router.get('/order/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const escrow = await escrowService.getEscrowByOrderId(orderId);

    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found',
      });
    }

    // Verify user is buyer or seller
    const seller = await sellerService.getSellerByUserId(userId);
    if (escrow.buyerId !== userId && (!seller || escrow.sellerId !== seller.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: escrow,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get buyer's escrows
router.get('/buyer/my-escrows', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const escrows = await escrowService.getBuyerEscrows(userId, status as any);

    res.json({
      success: true,
      data: escrows,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get seller's escrows
router.get('/seller/my-escrows', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const escrows = await escrowService.getSellerEscrows(seller.id, status as any);

    res.json({
      success: true,
      data: escrows,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Release escrow (buyer confirms delivery)
router.post('/:id/release', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const escrow = await escrowService.getEscrowById(id);

    // Verify user is the buyer
    if (escrow.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can release funds',
      });
    }

    const updatedEscrow = await escrowService.releaseEscrow(id, 'buyer');

    res.json({
      success: true,
      message: 'Funds released to seller successfully',
      data: updatedEscrow,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Request refund (seller initiates refund)
router.post('/:id/refund', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    const escrow = await escrowService.getEscrowById(id);

    // Verify user is the seller
    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller || escrow.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can initiate refund',
      });
    }

    const updatedEscrow = await escrowService.refundEscrow(id, reason, 'seller');

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: updatedEscrow,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== ADMIN ROUTES =====

// Get escrow by ID (admin)
router.get('/:id', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const escrow = await escrowService.getEscrowById(id);

    res.json({
      success: true,
      data: escrow,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Get escrow statistics (admin)
router.get('/admin/stats', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const stats = await escrowService.getEscrowStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin release escrow
router.post(
  '/:id/admin-release',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedEscrow = await escrowService.releaseEscrow(id, 'admin');

      res.json({
        success: true,
        message: 'Escrow released successfully',
        data: updatedEscrow,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Admin refund escrow
router.post(
  '/:id/admin-refund',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const updatedEscrow = await escrowService.refundEscrow(id, reason, 'admin');

      res.json({
        success: true,
        message: 'Escrow refunded successfully',
        data: updatedEscrow,
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
