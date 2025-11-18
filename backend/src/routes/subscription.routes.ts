import express, { Request, Response } from 'express';
import subscriptionService from '../services/subscription.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Create subscription
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const subscription = await subscriptionService.createSubscription({
      userId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's subscriptions
router.get('/my-subscriptions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, category } = req.query;

    const subscriptions = await subscriptionService.getUserSubscriptions(userId, {
      status: status as any,
      category: category as any,
    });

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get subscription analytics
router.get('/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const analytics = await subscriptionService.getSubscriptionAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get savings suggestions
router.get('/savings-suggestions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const suggestions = await subscriptionService.getSavingsSuggestions(userId);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Update subscription
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const subscription = await subscriptionService.updateSubscription(id, userId, req.body);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Cancel subscription
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const subscription = await subscriptionService.cancelSubscription(id, userId);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete subscription
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await subscriptionService.deleteSubscription(id, userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
