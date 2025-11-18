import express, { Request, Response } from 'express';
import suboneService from '../services/subone.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Get tier comparison
router.get('/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = suboneService.getTierComparison();

    res.json({
      success: true,
      data: tiers,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Calculate savings for user
router.get('/calculate-savings', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentCost } = req.query;

    if (!currentCost) {
      return res.status(400).json({
        success: false,
        message: 'Current subscription cost is required',
      });
    }

    const savings = await suboneService.calculateUserSavings(
      userId,
      parseFloat(currentCost as string)
    );

    res.json({
      success: true,
      data: savings,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Create membership
router.post('/subscribe', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tier, duration } = req.body;

    const membership = await suboneService.createMembership({
      userId,
      tier,
      duration,
    });

    res.status(201).json({
      success: true,
      message: 'SubONE membership created successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user's membership
router.get('/my-membership', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const membership = await suboneService.getUserMembership(userId);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No active membership found',
      });
    }

    // Calculate current savings
    const savings = membership.calculateSavings();
    const perPersonCost = membership.getPerPersonCost();

    res.json({
      success: true,
      data: {
        ...membership.toJSON(),
        currentSavings: savings,
        perPersonCost,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Upgrade membership
router.post('/upgrade', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tier } = req.body;

    const membership = await suboneService.upgradeMembership(userId, tier);

    res.json({
      success: true,
      message: 'Membership upgraded successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Add family member
router.post('/family/add', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { email } = req.body;

    const membership = await suboneService.addFamilyMember(userId, email);

    res.json({
      success: true,
      message: 'Family member added successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Remove family member
router.post('/family/remove', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { memberUserId } = req.body;

    const membership = await suboneService.removeFamilyMember(userId, memberUserId);

    res.json({
      success: true,
      message: 'Family member removed successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Activate trial
router.post('/activate-trial', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const membership = await suboneService.activateTrial(userId);

    res.json({
      success: true,
      message: 'Trial activated successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Cancel membership
router.post('/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reason } = req.body;

    const membership = await suboneService.cancelMembership(userId, reason);

    res.json({
      success: true,
      message: 'Membership cancelled successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Reactivate membership
router.post('/reactivate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const membership = await suboneService.reactivateMembership(userId);

    res.json({
      success: true,
      message: 'Membership reactivated successfully',
      data: membership,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
