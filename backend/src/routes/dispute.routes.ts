import express, { Request, Response } from 'express';
import disputeService from '../services/dispute.service';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import sellerService from '../services/seller.service';

const router = express.Router();

// Create a dispute
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId, reason, description, evidence } = req.body;

    const dispute = await disputeService.createDispute({
      orderId,
      buyerId: userId,
      reason,
      description,
      evidence,
    });

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: dispute,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get buyer's disputes
router.get('/buyer/my-disputes', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const disputes = await disputeService.getBuyerDisputes(userId);

    res.json({
      success: true,
      data: disputes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get seller's disputes
router.get('/seller/my-disputes', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const seller = await sellerService.getSellerByUserId(userId);

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const disputes = await disputeService.getSellerDisputes(seller.id);

    res.json({
      success: true,
      data: disputes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get dispute by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const dispute = await disputeService.getDisputeById(id);

    // Verify user is buyer or seller
    const seller = await sellerService.getSellerByUserId(userId);
    const isAdmin = req.user!.role === 'admin';

    if (
      dispute.buyerId !== userId &&
      (!seller || dispute.sellerId !== seller.id) &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: dispute,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Add seller response
router.post('/:id/seller-response', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user!.id;

    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const dispute = await disputeService.addSellerResponse(id, seller.id, response);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: dispute,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Add buyer response
router.post('/:id/buyer-response', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user!.id;

    const dispute = await disputeService.addBuyerResponse(id, userId, response);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: dispute,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Add evidence
router.post('/:id/evidence', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { evidenceUrl } = req.body;
    const userId = req.user!.id;

    const dispute = await disputeService.addEvidence(id, userId, evidenceUrl);

    res.json({
      success: true,
      message: 'Evidence added successfully',
      data: dispute,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== ADMIN ROUTES =====

// Get all disputes (admin)
router.get(
  '/',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { status, reason, assignedTo, sellerId, buyerId, page, limit } = req.query;

      const result = await disputeService.getAllDisputes({
        status: status as any,
        reason: reason as any,
        assignedTo: assignedTo as string,
        sellerId: sellerId as string,
        buyerId: buyerId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.disputes,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Assign dispute (admin)
router.post(
  '/:id/assign',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;

      const dispute = await disputeService.assignDispute(id, adminId || req.user!.id);

      res.json({
        success: true,
        message: 'Dispute assigned successfully',
        data: dispute,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Resolve dispute (admin)
router.post(
  '/:id/resolve',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resolution, notes, refundAmount } = req.body;
      const adminId = req.user!.id;

      const dispute = await disputeService.resolveDispute(
        id,
        adminId,
        resolution,
        notes,
        refundAmount
      );

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: dispute,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Close dispute (admin)
router.post(
  '/:id/close',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const dispute = await disputeService.closeDispute(id, adminId);

      res.json({
        success: true,
        message: 'Dispute closed successfully',
        data: dispute,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Escalate dispute (admin)
router.post(
  '/:id/escalate',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const dispute = await disputeService.escalateDispute(id, adminId);

      res.json({
        success: true,
        message: 'Dispute escalated successfully',
        data: dispute,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Get dispute statistics (admin)
router.get(
  '/admin/stats',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const stats = await disputeService.getDisputeStats();

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
  }
);

export default router;
