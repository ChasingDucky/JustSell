import UserProfile, { DemographicInfo } from '../models/UserProfile';
import behaviorTrackingService from './behaviorTracking.service';
import { BehaviorType } from '../models/UserBehavior';
import { Op } from 'sequelize';

class UserProfileService {
  /**
   * Get or create user profile
   */
  async getOrCreateProfile(userId: string): Promise<UserProfile> {
    let profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      profile = await UserProfile.create({
        userId,
        interestTags: [],
        behaviorMetrics: {
          totalViews: 0,
          totalPurchases: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          purchaseFrequency: 0,
          favoriteCategories: [],
          browsingSessions: 0,
          avgSessionDuration: 0,
        },
        demographics: {},
        purchasingPower: {
          level: 'moderate',
          minPrice: 0,
          maxPrice: 1000,
          avgPrice: 50,
        },
        preferredCategories: [],
        blockedCategories: [],
        blockedSellers: [],
        recommendationSettings: {
          enablePersonalized: true,
          enableTrending: true,
          enableSimilar: true,
          diversityLevel: 0.5,
        },
        completenessScore: 0,
        lastUpdated: new Date(),
      });
    }

    return profile;
  }

  /**
   * Update user demographics
   */
  async updateDemographics(userId: string, demographics: Partial<DemographicInfo>): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.demographics = {
      ...profile.demographics,
      ...demographics,
    };

    profile.completenessScore = profile.calculateCompleteness();
    profile.lastUpdated = new Date();

    await profile.save();
    return profile;
  }

  /**
   * Update preferred categories
   */
  async updatePreferredCategories(userId: string, categories: string[]): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.preferredCategories = categories;

    // Also update interest tags
    for (const category of categories) {
      await profile.updateInterestTag(category, 0.1);
    }

    profile.completenessScore = profile.calculateCompleteness();
    await profile.save();

    return profile;
  }

  /**
   * Block category
   */
  async blockCategory(userId: string, category: string): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    if (!profile.blockedCategories.includes(category)) {
      profile.blockedCategories.push(category);
    }

    // Remove from preferred if it exists
    profile.preferredCategories = profile.preferredCategories.filter(c => c !== category);

    // Reduce interest weight
    await profile.updateInterestTag(category, -0.5);

    await profile.save();
    return profile;
  }

  /**
   * Unblock category
   */
  async unblockCategory(userId: string, category: string): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.blockedCategories = profile.blockedCategories.filter(c => c !== category);

    await profile.save();
    return profile;
  }

  /**
   * Block seller
   */
  async blockSeller(userId: string, sellerId: string): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    if (!profile.blockedSellers.includes(sellerId)) {
      profile.blockedSellers.push(sellerId);
    }

    await profile.save();
    return profile;
  }

  /**
   * Unblock seller
   */
  async unblockSeller(userId: string, sellerId: string): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.blockedSellers = profile.blockedSellers.filter(s => s !== sellerId);

    await profile.save();
    return profile;
  }

  /**
   * Update price preference
   */
  async updatePricePreference(
    userId: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    if (minPrice !== undefined) {
      profile.minPricePreference = minPrice;
    }
    if (maxPrice !== undefined) {
      profile.maxPricePreference = maxPrice;
    }

    await profile.save();
    return profile;
  }

  /**
   * Update recommendation settings
   */
  async updateRecommendationSettings(
    userId: string,
    settings: Partial<{
      enablePersonalized: boolean;
      enableTrending: boolean;
      enableSimilar: boolean;
      diversityLevel: number;
    }>
  ): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.recommendationSettings = {
      ...profile.recommendationSettings,
      ...settings,
    };

    await profile.save();
    return profile;
  }

  /**
   * Get user profile with full details
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    return await UserProfile.findOne({
      where: { userId },
    });
  }

  /**
   * Rebuild user profile from behavior history
   */
  async rebuildProfile(userId: string): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(userId);

    // Get all purchase behaviors
    const purchases = await behaviorTrackingService.getPurchaseHistory(userId, 1000);

    // Reset behavior metrics
    profile.behaviorMetrics = {
      totalViews: 0,
      totalPurchases: 0,
      totalSpent: 0,
      avgOrderValue: 0,
      purchaseFrequency: 0,
      favoriteCategories: [],
      browsingSessions: 0,
      avgSessionDuration: 0,
    };

    profile.interestTags = [];

    // Rebuild from purchases
    const categoryCount: Record<string, number> = {};
    let totalSpent = 0;

    for (const purchase of purchases) {
      profile.behaviorMetrics.totalPurchases++;

      if (purchase.metadata?.price) {
        totalSpent += purchase.metadata.price;
      }

      if (purchase.metadata?.category) {
        const cat = purchase.metadata.category;
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;

        // Update interest tag based on purchase count
        const weight = Math.min(1, categoryCount[cat] * 0.1);
        await profile.updateInterestTag(cat, weight);
      }
    }

    profile.behaviorMetrics.totalSpent = totalSpent;
    if (profile.behaviorMetrics.totalPurchases > 0) {
      profile.behaviorMetrics.avgOrderValue =
        totalSpent / profile.behaviorMetrics.totalPurchases;
    }

    // Set favorite categories (top 5)
    profile.behaviorMetrics.favoriteCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    // Get all views
    const views = await behaviorTrackingService.getRecentViews(userId, 10000);
    profile.behaviorMetrics.totalViews = views.length;

    // Update completeness
    profile.completenessScore = profile.calculateCompleteness();
    profile.lastUpdated = new Date();

    await profile.save();
    return profile;
  }

  /**
   * Get similar users based on profile
   */
  async findSimilarUsers(userId: string, limit: number = 10): Promise<string[]> {
    const profile = await this.getProfile(userId);
    if (!profile) return [];

    const topInterests = profile.getTopInterests(5);
    if (topInterests.length === 0) return [];

    // Find users with similar interests
    const similarProfiles = await UserProfile.findAll({
      where: {
        userId: { [Op.ne]: userId },
      },
      limit: limit * 2, // Get more to filter
    });

    // Calculate similarity scores
    const similarities = similarProfiles
      .map(otherProfile => {
        const otherInterests = otherProfile.getTopInterests(5);
        const commonInterests = topInterests.filter(interest =>
          otherInterests.includes(interest)
        );

        return {
          userId: otherProfile.userId,
          score: commonInterests.length / topInterests.length,
        };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return similarities.map(s => s.userId);
  }

  /**
   * Get profile insights
   */
  async getProfileInsights(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const topInterests = profile.getTopInterests(10);
    const behaviorAnalytics = await behaviorTrackingService.getBehaviorAnalytics(userId);

    return {
      completenessScore: profile.completenessScore,
      topInterests,
      purchasingPower: profile.purchasingPower,
      behaviorMetrics: profile.behaviorMetrics,
      recommendationSettings: profile.recommendationSettings,
      behaviorAnalytics,
      profileSummary: {
        isActiveUser: profile.behaviorMetrics.totalPurchases > 5,
        isNewUser: profile.behaviorMetrics.totalPurchases === 0,
        isPremiumBuyer: profile.purchasingPower.level === 'premium' || profile.purchasingPower.level === 'luxury',
        hasStrongPreferences: profile.interestTags.length >= 5,
      },
    };
  }
}

export default new UserProfileService();
