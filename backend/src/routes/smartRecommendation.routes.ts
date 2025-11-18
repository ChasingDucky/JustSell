import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import smartRecommendationService from '../services/smartRecommendation.service';
import behaviorTrackingService from '../services/behaviorTracking.service';
import { BehaviorType } from '../models/UserBehavior';
import { FeedbackType } from '../models/RecommendationFeedback';

const router = Router();

// Get personalized recommendations
router.get('/personalized', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      limit = 20,
      excludeIds,
      minScore = 0.1,
      diversityBoost = true,
      minPrice,
      maxPrice,
    } = req.query;

    const options = {
      limit: Number(limit),
      excludeIds: excludeIds ? String(excludeIds).split(',') : [],
      minScore: Number(minScore),
      diversityBoost: diversityBoost === 'true' || diversityBoost === true,
      priceRange: {
        min: minPrice ? Number(minPrice) : undefined,
        max: maxPrice ? Number(maxPrice) : undefined,
      },
    };

    const recommendations = await smartRecommendationService.getPersonalizedRecommendations(
      userId,
      options
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get personalized recommendations',
    });
  }
});

// Get similar items
router.get('/similar/:itemType/:itemId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { itemType, itemId } = req.params;
    const { limit = 10 } = req.query;
    const userId = req.user?.id;

    if (itemType !== 'card' && itemType !== 'listing') {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "card" or "listing"',
      });
    }

    const recommendations = await smartRecommendationService.getSimilarItems(
      itemType,
      itemId,
      userId,
      Number(limit)
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error('Error getting similar items:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get similar items',
    });
  }
});

// Record recommendation feedback
router.post('/feedback', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      recommendationId,
      itemType,
      itemId,
      feedbackType,
      metadata = {},
    } = req.body;

    if (!recommendationId || !itemType || !itemId || !feedbackType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recommendationId, itemType, itemId, feedbackType',
      });
    }

    if (!['card', 'listing'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "card" or "listing"',
      });
    }

    const validFeedbackTypes = Object.values(FeedbackType);
    if (!validFeedbackTypes.includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid feedback type. Must be one of: ${validFeedbackTypes.join(', ')}`,
      });
    }

    await smartRecommendationService.recordFeedback(
      userId,
      recommendationId,
      itemType,
      itemId,
      feedbackType,
      metadata
    );

    // If user doesn't want to see similar items, we can block the category
    if (feedbackType === FeedbackType.NOT_INTERESTED && metadata.category) {
      // This will be handled by the service
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record feedback',
    });
  }
});

// Track behavior (view, click, etc.)
router.post('/track', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      behaviorType,
      targetType,
      targetId,
      metadata = {},
      sessionId,
    } = req.body;

    if (!behaviorType || !targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: behaviorType, targetType, targetId',
      });
    }

    const validBehaviorTypes = Object.values(BehaviorType);
    if (!validBehaviorTypes.includes(behaviorType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid behavior type. Must be one of: ${validBehaviorTypes.join(', ')}`,
      });
    }

    if (!['card', 'listing', 'seller', 'category'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type. Must be "card", "listing", "seller", or "category"',
      });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || '';
    const userAgent = req.headers['user-agent'] || '';

    await behaviorTrackingService.trackBehavior({
      userId,
      behaviorType,
      targetType,
      targetId,
      metadata,
      sessionId,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      message: 'Behavior tracked successfully',
    });
  } catch (error: any) {
    console.error('Error tracking behavior:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track behavior',
    });
  }
});

// Get behavior analytics
router.get('/analytics/behavior', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { days = 30 } = req.query;

    const analytics = await behaviorTrackingService.getBehaviorAnalytics(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Error getting behavior analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get behavior analytics',
    });
  }
});

// Get recent views
router.get('/history/views', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 20 } = req.query;

    const views = await behaviorTrackingService.getRecentViews(userId, Number(limit));

    res.json({
      success: true,
      data: views,
      count: views.length,
    });
  } catch (error: any) {
    console.error('Error getting recent views:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recent views',
    });
  }
});

// Get purchase history
router.get('/history/purchases', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 50 } = req.query;

    const purchases = await behaviorTrackingService.getPurchaseHistory(userId, Number(limit));

    res.json({
      success: true,
      data: purchases,
      count: purchases.length,
    });
  } catch (error: any) {
    console.error('Error getting purchase history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get purchase history',
    });
  }
});

export default router;
