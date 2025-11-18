import UserBehavior, { BehaviorType } from '../models/UserBehavior';
import UserProfile from '../models/UserProfile';
import { Card } from '../models/Card';
import UserListing from '../models/UserListing';
import { Order } from '../models/Order';
import { Op } from 'sequelize';

interface TrackBehaviorParams {
  userId: string;
  behaviorType: BehaviorType;
  targetType: 'card' | 'listing' | 'seller' | 'category';
  targetId: string;
  metadata?: any;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class BehaviorTrackingService {
  /**
   * Track user behavior
   */
  async trackBehavior(params: TrackBehaviorParams): Promise<UserBehavior> {
    const { userId, behaviorType, targetType, targetId, metadata = {}, sessionId, ipAddress, userAgent } = params;

    // Create behavior record
    const behavior = await UserBehavior.create({
      userId,
      behaviorType,
      targetType,
      targetId,
      metadata,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Asynchronously update user profile based on behavior
    this.updateUserProfileFromBehavior(behavior).catch(err =>
      console.error('Error updating user profile:', err)
    );

    return behavior;
  }

  /**
   * Update user profile based on behavior
   */
  private async updateUserProfileFromBehavior(behavior: UserBehavior): Promise<void> {
    let profile = await UserProfile.findOne({ where: { userId: behavior.userId } });

    if (!profile) {
      // Create new profile if doesn't exist
      profile = await UserProfile.create({
        userId: behavior.userId,
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

    const category = behavior.metadata?.category;

    switch (behavior.behaviorType) {
      case BehaviorType.VIEW:
        // Increment view count
        profile.behaviorMetrics.totalViews++;

        // Update interest tag (small positive weight)
        if (category) {
          await profile.updateInterestTag(category, 0.02);
        }
        break;

      case BehaviorType.CLICK:
        // Stronger signal than view
        if (category) {
          await profile.updateInterestTag(category, 0.05);
        }
        break;

      case BehaviorType.SEARCH:
        // Track search behavior
        if (category) {
          await profile.updateInterestTag(category, 0.03);
        }
        break;

      case BehaviorType.ADD_TO_CART:
        // Strong positive signal
        if (category) {
          await profile.updateInterestTag(category, 0.1);
        }
        break;

      case BehaviorType.PURCHASE:
        // Strongest positive signal
        profile.behaviorMetrics.totalPurchases++;

        if (behavior.metadata?.price) {
          const price = behavior.metadata.price;
          profile.behaviorMetrics.totalSpent += price;
          profile.behaviorMetrics.avgOrderValue =
            profile.behaviorMetrics.totalSpent / profile.behaviorMetrics.totalPurchases;
          profile.behaviorMetrics.lastPurchaseDate = new Date();

          // Update purchasing power based on purchase history
          this.updatePurchasingPower(profile, price);
        }

        if (category) {
          await profile.updateInterestTag(category, 0.2);

          // Update favorite categories
          if (!profile.behaviorMetrics.favoriteCategories.includes(category)) {
            profile.behaviorMetrics.favoriteCategories.push(category);
          }
        }
        break;

      case BehaviorType.FAVORITE:
        // Strong positive signal
        if (category) {
          await profile.updateInterestTag(category, 0.15);
        }
        break;

      case BehaviorType.UNFAVORITE:
        // Slight negative signal
        if (category) {
          await profile.updateInterestTag(category, -0.05);
        }
        break;

      case BehaviorType.REVIEW:
        // Engagement signal
        if (category) {
          await profile.updateInterestTag(category, 0.1);
        }
        break;
    }

    // Update completeness score
    profile.completenessScore = profile.calculateCompleteness();
    await profile.save();
  }

  /**
   * Update purchasing power based on purchase price
   */
  private updatePurchasingPower(profile: UserProfile, price: number): void {
    const { avgPrice, minPrice, maxPrice } = profile.purchasingPower;

    // Update price range
    if (minPrice === 0 || price < minPrice) {
      profile.purchasingPower.minPrice = price;
    }
    if (price > maxPrice) {
      profile.purchasingPower.maxPrice = price;
    }

    // Update average price
    const newAvg = (avgPrice * (profile.behaviorMetrics.totalPurchases - 1) + price) /
      profile.behaviorMetrics.totalPurchases;
    profile.purchasingPower.avgPrice = newAvg;

    // Determine purchasing power level
    if (newAvg < 20) {
      profile.purchasingPower.level = 'budget';
    } else if (newAvg < 50) {
      profile.purchasingPower.level = 'moderate';
    } else if (newAvg < 150) {
      profile.purchasingPower.level = 'premium';
    } else {
      profile.purchasingPower.level = 'luxury';
    }
  }

  /**
   * Get user behavior history
   */
  async getUserBehaviors(
    userId: string,
    options: {
      behaviorTypes?: BehaviorType[];
      targetType?: 'card' | 'listing' | 'seller' | 'category';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<UserBehavior[]> {
    const { behaviorTypes, targetType, startDate, endDate, limit = 100 } = options;

    const where: any = { userId };

    if (behaviorTypes && behaviorTypes.length > 0) {
      where.behaviorType = { [Op.in]: behaviorTypes };
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = startDate;
      if (endDate) where.timestamp[Op.lte] = endDate;
    }

    return await UserBehavior.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit,
    });
  }

  /**
   * Get recent viewed items
   */
  async getRecentViews(userId: string, limit: number = 20): Promise<UserBehavior[]> {
    return await this.getUserBehaviors(userId, {
      behaviorTypes: [BehaviorType.VIEW],
      limit,
    });
  }

  /**
   * Get user purchase history
   */
  async getPurchaseHistory(userId: string, limit: number = 50): Promise<UserBehavior[]> {
    return await this.getUserBehaviors(userId, {
      behaviorTypes: [BehaviorType.PURCHASE],
      limit,
    });
  }

  /**
   * Get user search history
   */
  async getSearchHistory(userId: string, limit: number = 50): Promise<UserBehavior[]> {
    return await this.getUserBehaviors(userId, {
      behaviorTypes: [BehaviorType.SEARCH],
      limit,
    });
  }

  /**
   * Get behavior analytics for a user
   */
  async getBehaviorAnalytics(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const behaviors = await this.getUserBehaviors(userId, {
      startDate,
    });

    // Aggregate by behavior type
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    behaviors.forEach(behavior => {
      // Count by type
      byType[behavior.behaviorType] = (byType[behavior.behaviorType] || 0) + 1;

      // Count by category
      if (behavior.metadata?.category) {
        const cat = behavior.metadata.category;
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }

      // Count by day
      const day = behavior.timestamp.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      totalBehaviors: behaviors.length,
      byType,
      byCategory,
      byDay,
      mostActiveDay: Object.keys(byDay).reduce((a, b) => (byDay[a] > byDay[b] ? a : b), ''),
      topCategories: Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
    };
  }

  /**
   * Track session
   */
  async trackSession(userId: string, sessionId: string, duration: number): Promise<void> {
    const profile = await UserProfile.findOne({ where: { userId } });

    if (profile) {
      profile.behaviorMetrics.browsingSessions++;

      // Update average session duration
      const totalSessions = profile.behaviorMetrics.browsingSessions;
      const avgDuration = profile.behaviorMetrics.avgSessionDuration;
      profile.behaviorMetrics.avgSessionDuration =
        (avgDuration * (totalSessions - 1) + duration) / totalSessions;

      await profile.save();
    }
  }
}

export default new BehaviorTrackingService();
