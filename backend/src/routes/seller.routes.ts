import express, { Request, Response } from 'express';
import sellerService from '../services/seller.service';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';

const router = express.Router();

// Apply to become a seller
router.post('/apply', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { storeName, description, logo, businessLicense, idVerification } = req.body;

    const seller = await sellerService.applyAsSeller({
      userId,
      storeName,
      description,
      logo,
      businessLicense,
      idVerification,
    });

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully',
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get current user's seller profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const seller = await sellerService.getSellerByUserId(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    res.json({
      success: true,
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get seller dashboard
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const seller = await sellerService.getSellerByUserId(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const dashboard = await sellerService.getSellerDashboard(seller.id);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Update seller profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const seller = await sellerService.getSellerByUserId(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const { storeName, description, logo, bankAccount, paypalEmail, cryptoAddress } = req.body;

    const updatedSeller = await sellerService.updateSellerProfile(seller.id, {
      storeName,
      description,
      logo,
      bankAccount,
      paypalEmail,
      cryptoAddress,
    });

    res.json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedSeller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get seller by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const seller = await sellerService.getSellerById(id);

    res.json({
      success: true,
      data: seller,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== ADMIN ROUTES =====

// Get all sellers (admin)
router.get('/', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { status, level, verified, minRating, search, page, limit } = req.query;

    const result = await sellerService.getAllSellers({
      status: status as any,
      level: level as any,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.sellers,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Approve seller application (admin)
router.post('/:id/approve', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const seller = await sellerService.approveSeller(id, adminId);

    res.json({
      success: true,
      message: 'Seller approved successfully',
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Reject seller application (admin)
router.post('/:id/reject', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const seller = await sellerService.rejectSeller(id, reason, adminId);

    res.json({
      success: true,
      message: 'Seller rejected successfully',
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Suspend seller (admin)
router.post('/:id/suspend', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const seller = await sellerService.suspendSeller(id, reason, adminId);

    res.json({
      success: true,
      message: 'Seller suspended successfully',
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Reactivate seller (admin)
router.post('/:id/reactivate', authenticate, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const seller = await sellerService.reactivateSeller(id, adminId);

    res.json({
      success: true,
      message: 'Seller reactivated successfully',
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
