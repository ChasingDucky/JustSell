import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import userProfileService from '../services/userProfile.service';

const router = Router();

// Get user profile
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const profile = await userProfileService.getOrCreateProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user profile',
    });
  }
});

// Get profile insights
router.get('/insights', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const insights = await userProfileService.getProfileInsights(userId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('Error getting profile insights:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile insights',
    });
  }
});

// Update demographics
router.put('/demographics', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { ageGroup, gender, location, language, timezone } = req.body;

    const profile = await userProfileService.updateDemographics(userId, {
      ageGroup,
      gender,
      location,
      language,
      timezone,
    });

    res.json({
      success: true,
      data: profile,
      message: 'Demographics updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating demographics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update demographics',
    });
  }
});

// Update preferred categories
router.put('/preferences/categories', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array',
      });
    }

    const profile = await userProfileService.updatePreferredCategories(userId, categories);

    res.json({
      success: true,
      data: profile,
      message: 'Preferred categories updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating preferred categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update preferred categories',
    });
  }
});

// Block category
router.post('/block/category', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    const profile = await userProfileService.blockCategory(userId, category);

    res.json({
      success: true,
      data: profile,
      message: 'Category blocked successfully',
    });
  } catch (error: any) {
    console.error('Error blocking category:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to block category',
    });
  }
});

// Unblock category
router.post('/unblock/category', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    const profile = await userProfileService.unblockCategory(userId, category);

    res.json({
      success: true,
      data: profile,
      message: 'Category unblocked successfully',
    });
  } catch (error: any) {
    console.error('Error unblocking category:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unblock category',
    });
  }
});

// Block seller
router.post('/block/seller', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required',
      });
    }

    const profile = await userProfileService.blockSeller(userId, sellerId);

    res.json({
      success: true,
      data: profile,
      message: 'Seller blocked successfully',
    });
  } catch (error: any) {
    console.error('Error blocking seller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to block seller',
    });
  }
});

// Unblock seller
router.post('/unblock/seller', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required',
      });
    }

    const profile = await userProfileService.unblockSeller(userId, sellerId);

    res.json({
      success: true,
      data: profile,
      message: 'Seller unblocked successfully',
    });
  } catch (error: any) {
    console.error('Error unblocking seller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unblock seller',
    });
  }
});

// Update price preference
router.put('/preferences/price', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { minPrice, maxPrice } = req.body;

    const profile = await userProfileService.updatePricePreference(userId, minPrice, maxPrice);

    res.json({
      success: true,
      data: profile,
      message: 'Price preference updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating price preference:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update price preference',
    });
  }
});

// Update recommendation settings
router.put('/preferences/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { enablePersonalized, enableTrending, enableSimilar, diversityLevel } = req.body;

    const profile = await userProfileService.updateRecommendationSettings(userId, {
      enablePersonalized,
      enableTrending,
      enableSimilar,
      diversityLevel,
    });

    res.json({
      success: true,
      data: profile,
      message: 'Recommendation settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating recommendation settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update recommendation settings',
    });
  }
});

// Rebuild profile from history
router.post('/rebuild', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const profile = await userProfileService.rebuildProfile(userId);

    res.json({
      success: true,
      data: profile,
      message: 'Profile rebuilt successfully',
    });
  } catch (error: any) {
    console.error('Error rebuilding profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to rebuild profile',
    });
  }
});

export default router;
