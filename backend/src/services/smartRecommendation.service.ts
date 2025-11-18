import { Card } from '../models/Card';
import UserListing from '../models/UserListing';
import UserProfile from '../models/UserProfile';
import UserBehavior, { BehaviorType } from '../models/UserBehavior';
import RecommendationFeedback, { RecommendationSource, FeedbackType } from '../models/RecommendationFeedback';
import userProfileService from './userProfile.service';
import behaviorTrackingService from './behaviorTracking.service';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface RecommendationItem {
  type: 'card' | 'listing';
  id: string;
  item: Card | UserListing;
  score: number;
  reason: string[];
  source: RecommendationSource;
}

interface RecommendationOptions {
  limit?: number;
  excludeIds?: string[];
  minScore?: number;
  diversityBoost?: boolean;
  priceRange?: { min?: number; max?: number };
}

class SmartRecommendationService {
  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<RecommendationItem[]> {
    const { limit = 20, excludeIds = [], minScore = 0.1 } = options;

    // Get user profile
    const profile = await userProfileService.getOrCreateProfile(userId);

    if (!profile.recommendationSettings.enablePersonalized) {
      return [];
    }

    // Get recommendations from different sources
    const [contentBased, collaborative, trending] = await Promise.all([
      this.getContentBasedRecommendations(userId, profile, { ...options, limit: limit * 2 }),
      this.getCollaborativeRecommendations(userId, profile, { ...options, limit: limit * 2 }),
      profile.recommendationSettings.enableTrending
        ? this.getTrendingRecommendations(userId, { ...options, limit: Math.floor(limit / 2) })
        : [],
    ]);

    // Combine and score
    const combined = this.combineRecommendations(
      [...contentBased, ...collaborative, ...trending],
      profile
    );

    // Filter
    const filtered = combined
      .filter(item => !excludeIds.includes(item.id))
      .filter(item => item.score >= minScore)
      .filter(item => !this.isFiltered(item, profile));

    // Apply diversity if enabled
    const diversified = options.diversityBoost
      ? this.applyDiversity(filtered, profile.recommendationSettings.diversityLevel)
      : filtered;

    return diversified.slice(0, limit);
  }

  /**
   * Content-based recommendations
   */
  private async getContentBasedRecommendations(
    userId: string,
    profile: UserProfile,
    options: RecommendationOptions
  ): Promise<RecommendationItem[]> {
    const topInterests = profile.getTopInterests(10);
    if (topInterests.length === 0) return [];

    const { priceRange } = options;

    // Build query for cards
    const cardWhere: any = {
      status: 'active',
      category: { [Op.in]: topInterests },
    };

    if (priceRange?.min !== undefined) {
      cardWhere.price = { ...cardWhere.price, [Op.gte]: priceRange.min };
    }
    if (priceRange?.max !== undefined) {
      cardWhere.price = { ...cardWhere.price, [Op.lte]: priceRange.max };
    }

    const cards = await Card.findAll({
      where: cardWhere,
      limit: 50,
      order: [['rating', 'DESC']],
    });

    // Build query for listings
    const listingWhere: any = {
      status: 'active',
      category: { [Op.in]: topInterests },
      isPhysicalProduct: false, // For now, focus on virtual products
    };

    if (profile.blockedSellers.length > 0) {
      listingWhere.sellerId = { [Op.notIn]: profile.blockedSellers };
    }

    if (priceRange?.min !== undefined) {
      listingWhere.price = { ...listingWhere.price, [Op.gte]: priceRange.min };
    }
    if (priceRange?.max !== undefined) {
      listingWhere.price = { ...listingWhere.price, [Op.lte]: priceRange.max };
    }

    const listings = await UserListing.findAll({
      where: listingWhere,
      limit: 50,
      order: [['rating', 'DESC']],
    });

    // Score items based on interest match
    const recommendations: RecommendationItem[] = [];

    for (const card of cards) {
      const interestTag = profile.interestTags.find(tag => tag.category === card.category);
      const score = interestTag ? interestTag.weight * 0.8 + (card.rating / 5) * 0.2 : 0.5;

      recommendations.push({
        type: 'card',
        id: card.id,
        item: card,
        score,
        reason: [`Based on your interest in ${card.category}`, `Rated ${card.rating}/5`],
        source: RecommendationSource.CONTENT_BASED,
      });
    }

    for (const listing of listings) {
      const interestTag = profile.interestTags.find(tag => tag.category === listing.category);
      const score = interestTag ? interestTag.weight * 0.8 + (listing.rating / 5) * 0.2 : 0.5;

      recommendations.push({
        type: 'listing',
        id: listing.id,
        item: listing,
        score,
        reason: [`Based on your interest in ${listing.category}`, `Rated ${listing.rating}/5`],
        source: RecommendationSource.CONTENT_BASED,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userId: string,
    profile: UserProfile,
    options: RecommendationOptions
  ): Promise<RecommendationItem[]> {
    // Find similar users
    const similarUsers = await userProfileService.findSimilarUsers(userId, 20);
    if (similarUsers.length === 0) return [];

    // Get what similar users purchased/liked
    const similarUserPurchases = await UserBehavior.findAll({
      where: {
        userId: { [Op.in]: similarUsers },
        behaviorType: { [Op.in]: [BehaviorType.PURCHASE, BehaviorType.FAVORITE] },
      },
      limit: 200,
      order: [['timestamp', 'DESC']],
    });

    // Count frequency
    const itemFrequency: Record<string, { count: number; targetType: 'card' | 'listing' }> = {};

    for (const behavior of similarUserPurchases) {
      const key = `${behavior.targetType}:${behavior.targetId}`;
      if (!itemFrequency[key]) {
        itemFrequency[key] = { count: 0, targetType: behavior.targetType };
      }
      itemFrequency[key].count++;
    }

    // Get top items
    const topItems = Object.entries(itemFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 100);

    const recommendations: RecommendationItem[] = [];

    for (const [key, data] of topItems) {
      const [type, id] = key.split(':');
      const itemType = type as 'card' | 'listing';

      let item: Card | UserListing | null = null;

      if (itemType === 'card') {
        item = await Card.findByPk(id);
      } else {
        item = await UserListing.findByPk(id);
      }

      if (item) {
        const score = Math.min(1, data.count / similarUsers.length);

        recommendations.push({
          type: itemType,
          id,
          item,
          score,
          reason: [
            `${data.count} similar users liked this`,
            'Popular among users like you',
          ],
          source: RecommendationSource.COLLABORATIVE,
        });
      }
    }

    return recommendations;
  }

  /**
   * Trending recommendations
   */
  private async getTrendingRecommendations(
    userId: string,
    options: RecommendationOptions
  ): Promise<RecommendationItem[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - 7);

    // Get trending cards
    const trendingCards = await Card.findAll({
      where: {
        status: 'active',
        createdAt: { [Op.gte]: daysAgo },
      },
      order: [['reviewCount', 'DESC'], ['rating', 'DESC']],
      limit: 20,
    });

    // Get trending listings
    const trendingListings = await UserListing.findAll({
      where: {
        status: 'active',
        createdAt: { [Op.gte]: daysAgo },
      },
      order: [['soldCount', 'DESC'], ['rating', 'DESC']],
      limit: 20,
    });

    const recommendations: RecommendationItem[] = [];

    for (const card of trendingCards) {
      recommendations.push({
        type: 'card',
        id: card.id,
        item: card,
        score: 0.7,
        reason: ['Trending this week', `${card.reviewCount} reviews`],
        source: RecommendationSource.TRENDING,
      });
    }

    for (const listing of trendingListings) {
      recommendations.push({
        type: 'listing',
        id: listing.id,
        item: listing,
        score: 0.7,
        reason: ['Trending this week', `${listing.soldCount} sold`],
        source: RecommendationSource.TRENDING,
      });
    }

    return recommendations;
  }

  /**
   * Get similar items
   */
  async getSimilarItems(
    itemType: 'card' | 'listing',
    itemId: string,
    userId?: string,
    limit: number = 10
  ): Promise<RecommendationItem[]> {
    let sourceItem: Card | UserListing | null = null;

    if (itemType === 'card') {
      sourceItem = await Card.findByPk(itemId);
    } else {
      sourceItem = await UserListing.findByPk(itemId);
    }

    if (!sourceItem) return [];

    const category = sourceItem.category;
    const price = Number(sourceItem.price);

    // Find similar items
    const similarWhere: any = {
      id: { [Op.ne]: itemId },
      category,
      status: 'active',
      price: {
        [Op.between]: [price * 0.7, price * 1.3], // Within 30% price range
      },
    };

    let similarItems: (Card | UserListing)[] = [];

    if (itemType === 'card') {
      similarItems = await Card.findAll({
        where: similarWhere,
        order: [['rating', 'DESC']],
        limit: limit * 2,
      });
    } else {
      similarItems = await UserListing.findAll({
        where: similarWhere,
        order: [['rating', 'DESC']],
        limit: limit * 2,
      });
    }

    const recommendations: RecommendationItem[] = similarItems.map(item => ({
      type: itemType,
      id: item.id,
      item,
      score: 0.8,
      reason: ['Similar category', 'Similar price range'],
      source: RecommendationSource.SIMILAR_ITEMS,
    }));

    return recommendations.slice(0, limit);
  }

  /**
   * Combine recommendations from different sources
   */
  private combineRecommendations(
    recommendations: RecommendationItem[],
    profile: UserProfile
  ): RecommendationItem[] {
    // Deduplicate
    const seen = new Set<string>();
    const unique: RecommendationItem[] = [];

    for (const rec of recommendations) {
      const key = `${rec.type}:${rec.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      } else {
        // If duplicate, boost score and merge reasons
        const existing = unique.find(r => `${r.type}:${r.id}` === key);
        if (existing) {
          existing.score = Math.max(existing.score, rec.score) * 1.1; // Boost for multiple sources
          existing.reason = [...new Set([...existing.reason, ...rec.reason])];
        }
      }
    }

    // Apply feedback learning
    const withFeedback = this.applyFeedbackLearning(unique, profile.userId);

    return withFeedback.sort((a, b) => b.score - a.score);
  }

  /**
   * Apply feedback learning to adjust scores
   */
  private applyFeedbackLearning(recommendations: RecommendationItem[], userId: string): RecommendationItem[] {
    // This would query recent feedback and adjust scores
    // For now, just return as-is
    return recommendations;
  }

  /**
   * Check if item should be filtered
   */
  private isFiltered(item: RecommendationItem, profile: UserProfile): boolean {
    // Check blocked categories
    const category = (item.item as any).category;
    if (profile.blockedCategories.includes(category)) {
      return true;
    }

    // Check blocked sellers (for listings)
    if (item.type === 'listing') {
      const listing = item.item as UserListing;
      if (profile.blockedSellers.includes(listing.sellerId)) {
        return true;
      }
    }

    // Check price range
    const price = Number(item.item.price);
    if (profile.minPricePreference !== undefined && price < profile.minPricePreference) {
      return true;
    }
    if (profile.maxPricePreference !== undefined && price > profile.maxPricePreference) {
      return true;
    }

    return false;
  }

  /**
   * Apply diversity to recommendations
   */
  private applyDiversity(recommendations: RecommendationItem[], diversityLevel: number): RecommendationItem[] {
    if (diversityLevel === 0) return recommendations;

    const categorySeen: Record<string, number> = {};
    const result: RecommendationItem[] = [];

    for (const rec of recommendations) {
      const category = (rec.item as any).category;
      const count = categorySeen[category] || 0;

      // Penalize repeated categories based on diversity level
      const penalty = count * diversityLevel * 0.2;
      const adjustedScore = rec.score * (1 - penalty);

      if (adjustedScore > 0.1) {
        result.push({ ...rec, score: adjustedScore });
        categorySeen[category] = count + 1;
      }
    }

    return result.sort((a, b) => b.score - a.score);
  }

  /**
   * Record recommendation feedback
   */
  async recordFeedback(
    userId: string,
    recommendationId: string,
    itemType: 'card' | 'listing',
    itemId: string,
    feedbackType: FeedbackType,
    metadata: any = {}
  ): Promise<void> {
    const feedbackValue = feedbackType === FeedbackType.LIKE || feedbackType === FeedbackType.MORE_LIKE_THIS
      ? 1
      : feedbackType === FeedbackType.DISLIKE || feedbackType === FeedbackType.NOT_INTERESTED
      ? -1
      : 0;

    await RecommendationFeedback.create({
      userId,
      recommendationId,
      itemType,
      itemId,
      recommendationSource: RecommendationSource.HYBRID,
      recommendationScore: metadata.originalScore || 0.5,
      position: metadata.position || 0,
      feedbackType,
      feedbackValue,
      metadata,
      timestamp: new Date(),
    });

    // Update user profile based on feedback
    const profile = await userProfileService.getOrCreateProfile(userId);

    if (feedbackType === FeedbackType.DISLIKE || feedbackType === FeedbackType.NOT_INTERESTED) {
      // Negative feedback
      if (metadata.category) {
        await profile.updateInterestTag(metadata.category, -0.1);
      }
    } else if (feedbackType === FeedbackType.LIKE || feedbackType === FeedbackType.MORE_LIKE_THIS) {
      // Positive feedback
      if (metadata.category) {
        await profile.updateInterestTag(metadata.category, 0.15);
      }
    }
  }
}

export default new SmartRecommendationService();
