import express, { Request, Response } from 'express';
import listingService from '../services/listing.service';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import sellerService from '../services/seller.service';

const router = express.Router();

// Create a new listing
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get seller profile
    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'You must be a seller to create listings',
      });
    }

    const listing = await listingService.createListing({
      sellerId: seller.id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get seller's listings
router.get('/my-listings', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const seller = await sellerService.getSellerByUserId(userId);

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const { status, category, page, limit } = req.query;

    const result = await listingService.getSellerListings(seller.id, {
      status: status as any,
      category: category as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.listings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Search listings (public)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      deliveryType,
      features,
      tags,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const result = await listingService.searchListings({
      search: search as string,
      category: category as any,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      deliveryType: deliveryType as any,
      features: features ? (features as string).split(',') : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.listings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get listing by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incrementView = req.query.view === 'true';

    const listing = await listingService.getListingById(id, incrementView);

    res.json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Update listing
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const listing = await listingService.updateListing(id, seller.id, req.body);

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: listing,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Submit listing for review
router.post('/:id/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const listing = await listingService.submitForReview(id, seller.id);

    res.json({
      success: true,
      message: 'Listing submitted for review',
      data: listing,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Update stock
router.patch('/:id/stock', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { stock } = req.body;

    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const listing = await listingService.updateStock(id, seller.id, stock);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: listing,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete listing
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const result = await listingService.deleteListing(id, seller.id);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Toggle favorite
router.post('/:id/favorite', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { increment } = req.body;

    const listing = await listingService.toggleFavorite(id, increment);

    res.json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== ADMIN ROUTES =====

// Get pending listings (admin)
router.get(
  '/admin/pending',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query;

      const result = await listingService.getPendingListings(
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: result.listings,
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

// Approve listing (admin)
router.post(
  '/:id/approve',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user!.id;

      const listing = await listingService.approveListing(id, adminId, notes);

      res.json({
        success: true,
        message: 'Listing approved successfully',
        data: listing,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Reject listing (admin)
router.post(
  '/:id/reject',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      const listing = await listingService.rejectListing(id, adminId, reason);

      res.json({
        success: true,
        message: 'Listing rejected successfully',
        data: listing,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Suspend listing (admin)
router.post(
  '/:id/suspend',
  authenticate,
  authorizeRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      const listing = await listingService.suspendListing(id, reason, adminId);

      res.json({
        success: true,
        message: 'Listing suspended successfully',
        data: listing,
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
