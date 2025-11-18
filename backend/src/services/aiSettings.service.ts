import UserAISettings from '../models/UserAISettings';
import SubONEMembership from '../models/SubONEMembership';
import geminiClient from '../config/gemini';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../utils/encryption';

class AISettingsService {
  /**
   * Get or create AI settings for user
   */
  async getOrCreateSettings(userId: string): Promise<UserAISettings> {
    let settings = await UserAISettings.findOne({ where: { userId } });

    if (!settings) {
      settings = await UserAISettings.create({
        userId,
        enableAI: true,
      });
    }

    return settings;
  }

  /**
   * Update user's Gemini API key
   */
  async updateApiKey(userId: string, geminiApiKey: string): Promise<UserAISettings> {
    // Validate API key
    const isValid = await geminiClient.validateApiKey(geminiApiKey);
    if (!isValid) {
      throw new Error('Invalid Gemini API key. Please check your key and try again.');
    }

    let settings = await this.getOrCreateSettings(userId);

    // Encrypt API key before storing
    const encryptedKey = encryptApiKey(geminiApiKey);
    settings.geminiApiKeyEncrypted = encryptedKey;
    settings.geminiApiKey = undefined; // Clear plain text field

    await settings.save();

    return settings;
  }

  /**
   * Remove user's API key
   */
  async removeApiKey(userId: string): Promise<UserAISettings> {
    let settings = await this.getOrCreateSettings(userId);

    settings.geminiApiKey = undefined;
    settings.geminiApiKeyEncrypted = undefined;
    await settings.save();

    return settings;
  }

  /**
   * Update AI preferences
   */
  async updatePreferences(userId: string, preferences: {
    enableAI?: boolean;
    preferredModel?: 'pro' | 'flash';
  }): Promise<UserAISettings> {
    let settings = await this.getOrCreateSettings(userId);

    if (preferences.enableAI !== undefined) {
      settings.enableAI = preferences.enableAI;
    }

    if (preferences.preferredModel !== undefined) {
      settings.preferredModel = preferences.preferredModel;
    }

    await settings.save();
    return settings;
  }

  /**
   * Get AI settings with user info
   */
  async getSettings(userId: string): Promise<{
    settings: UserAISettings;
    hasApiKey: boolean;
    isPremiumUser: boolean;
    availableModels: Array<{ name: string; description: string }>;
  }> {
    const settings = await this.getOrCreateSettings(userId);
    const isPremiumUser = await this.checkPremiumStatus(userId);

    return {
      settings,
      hasApiKey: settings.hasApiKey() || geminiClient.isSystemApiAvailable(),
      isPremiumUser,
      availableModels: geminiClient.getAvailableModels(isPremiumUser),
    };
  }

  /**
   * Check if user is premium (has SubONE Premium or Ultimate membership)
   */
  async checkPremiumStatus(userId: string): Promise<boolean> {
    const membership = await SubONEMembership.findOne({
      where: {
        userId,
        status: 'active',
      },
    });

    if (!membership) {
      return false;
    }

    // Premium or Ultimate tier users are considered premium
    return membership.tier === 'premium' || membership.tier === 'ultimate';
  }

  /**
   * Get user's API configuration for Gemini
   */
  async getApiConfig(userId: string): Promise<{
    userApiKey?: string;
    isPremiumUser: boolean;
  }> {
    const settings = await UserAISettings.findOne({ where: { userId } });
    const isPremiumUser = await this.checkPremiumStatus(userId);

    // Decrypt API key if exists
    let userApiKey: string | undefined;
    if (settings?.geminiApiKeyEncrypted) {
      try {
        userApiKey = decryptApiKey(settings.geminiApiKeyEncrypted);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        userApiKey = undefined;
      }
    } else if (settings?.geminiApiKey) {
      // Fallback for legacy plain text keys (migrate them)
      userApiKey = settings.geminiApiKey;
      try {
        settings.geminiApiKeyEncrypted = encryptApiKey(userApiKey);
        settings.geminiApiKey = undefined;
        await settings.save();
      } catch (error) {
        console.error('Failed to migrate plain text API key:', error);
      }
    }

    return {
      userApiKey,
      isPremiumUser,
    };
  }
}

export default new AISettingsService();
