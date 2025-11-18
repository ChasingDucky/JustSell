import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import aiSettingsService from '../services/aiSettings.service';

const router = Router();

// Get AI settings
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const settingsInfo = await aiSettingsService.getSettings(userId);

    res.json({
      success: true,
      data: {
        ...settingsInfo,
        // Don't expose the API key in response
        settings: {
          ...settingsInfo.settings.toJSON(),
          geminiApiKey: settingsInfo.settings.hasApiKey() ? '********' : null,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting AI settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI settings',
    });
  }
});

// Update Gemini API key
router.post('/api-key', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { geminiApiKey } = req.body;

    if (!geminiApiKey || typeof geminiApiKey !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid Gemini API key is required',
      });
    }

    const settings = await aiSettingsService.updateApiKey(userId, geminiApiKey);

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        hasApiKey: true,
        enableAI: settings.enableAI,
      },
    });
  } catch (error: any) {
    console.error('Error updating API key:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update API key',
    });
  }
});

// Remove API key
router.delete('/api-key', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await aiSettingsService.removeApiKey(userId);

    res.json({
      success: true,
      message: 'API key removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing API key:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove API key',
    });
  }
});

// Update AI preferences
router.put('/preferences', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { enableAI, preferredModel } = req.body;

    const settings = await aiSettingsService.updatePreferences(userId, {
      enableAI,
      preferredModel,
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: settings,
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update preferences',
    });
  }
});

// Get available models
router.get('/models', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const isPremiumUser = await aiSettingsService.checkPremiumStatus(userId);
    const geminiClient = (await import('../config/gemini')).default;
    const models = geminiClient.getAvailableModels(isPremiumUser);

    res.json({
      success: true,
      data: {
        models,
        isPremiumUser,
        message: isPremiumUser
          ? '您是白金会员，可以使用Gemini 1.5 Pro模型'
          : '升级到白金会员（SubONE Premium/Ultimate）解锁Gemini 1.5 Pro模型',
      },
    });
  } catch (error: any) {
    console.error('Error getting models:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get models',
    });
  }
});

export default router;
