import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface InterestTag {
  category: string;
  weight: number; // 0-1, higher means more interested
  lastUpdated: Date;
}

export interface BehaviorMetrics {
  totalViews: number;
  totalPurchases: number;
  totalSpent: number;
  avgOrderValue: number;
  purchaseFrequency: number; // purchases per month
  lastPurchaseDate?: Date;
  favoriteCategories: string[];
  browsingSessions: number;
  avgSessionDuration: number; // in seconds
}

export interface DemographicInfo {
  ageGroup?: string; // '18-24', '25-34', '35-44', '45-54', '55+'
  gender?: string;
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
  language?: string;
  timezone?: string;
}

export interface PurchasingPower {
  level: 'budget' | 'moderate' | 'premium' | 'luxury';
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
}

interface UserProfileAttributes {
  id: string;
  userId: string;

  // Interest tags with weights
  interestTags: InterestTag[];

  // Behavioral metrics
  behaviorMetrics: BehaviorMetrics;

  // Demographic information
  demographics: DemographicInfo;

  // Purchasing power
  purchasingPower: PurchasingPower;

  // Preferred categories (user selected)
  preferredCategories: string[];

  // Blocked categories (user doesn't want to see)
  blockedCategories: string[];

  // Blocked sellers
  blockedSellers: string[];

  // Price range preference
  minPricePreference?: number;
  maxPricePreference?: number;

  // Recommendation preferences
  recommendationSettings: {
    enablePersonalized: boolean;
    enableTrending: boolean;
    enableSimilar: boolean;
    diversityLevel: number; // 0-1, higher = more diverse recommendations
  };

  // Profile completeness score (0-100)
  completenessScore: number;

  // Last profile update
  lastUpdated: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

interface UserProfileCreationAttributes
  extends Optional<UserProfileAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserProfile
  extends Model<UserProfileAttributes, UserProfileCreationAttributes>
  implements UserProfileAttributes
{
  public id!: string;
  public userId!: string;
  public interestTags!: InterestTag[];
  public behaviorMetrics!: BehaviorMetrics;
  public demographics!: DemographicInfo;
  public purchasingPower!: PurchasingPower;
  public preferredCategories!: string[];
  public blockedCategories!: string[];
  public blockedSellers!: string[];
  public minPricePreference?: number;
  public maxPricePreference?: number;
  public recommendationSettings!: {
    enablePersonalized: boolean;
    enableTrending: boolean;
    enableSimilar: boolean;
    diversityLevel: number;
  };
  public completenessScore!: number;
  public lastUpdated!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calculate profile completeness
  public calculateCompleteness(): number {
    let score = 0;

    // Demographics (30 points)
    if (this.demographics.ageGroup) score += 10;
    if (this.demographics.gender) score += 10;
    if (this.demographics.location?.country) score += 10;

    // Preferences (20 points)
    if (this.preferredCategories.length > 0) score += 20;

    // Behavior (30 points)
    if (this.behaviorMetrics.totalViews > 10) score += 10;
    if (this.behaviorMetrics.totalPurchases > 0) score += 20;

    // Interest tags (20 points)
    if (this.interestTags.length > 5) score += 20;
    else if (this.interestTags.length > 0) score += 10;

    return score;
  }

  // Update interest tag weight
  public async updateInterestTag(category: string, delta: number): Promise<void> {
    const existingTag = this.interestTags.find(tag => tag.category === category);

    if (existingTag) {
      // Update existing tag
      existingTag.weight = Math.max(0, Math.min(1, existingTag.weight + delta));
      existingTag.lastUpdated = new Date();
    } else {
      // Add new tag
      this.interestTags.push({
        category,
        weight: Math.max(0, Math.min(1, 0.5 + delta)),
        lastUpdated: new Date(),
      });
    }

    // Keep only top 20 tags
    this.interestTags = this.interestTags
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);

    this.lastUpdated = new Date();
    await this.save();
  }

  // Get top interest categories
  public getTopInterests(limit: number = 5): string[] {
    return this.interestTags
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(tag => tag.category);
  }

  // Check if category is blocked
  public isCategoryBlocked(category: string): boolean {
    return this.blockedCategories.includes(category);
  }

  // Check if seller is blocked
  public isSellerBlocked(sellerId: string): boolean {
    return this.blockedSellers.includes(sellerId);
  }

  // Update behavior metrics
  public async updateBehaviorMetrics(updates: Partial<BehaviorMetrics>): Promise<void> {
    this.behaviorMetrics = {
      ...this.behaviorMetrics,
      ...updates,
    };
    this.lastUpdated = new Date();
    await this.save();
  }
}

UserProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    interestTags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    behaviorMetrics: {
      type: DataTypes.JSON,
      defaultValue: {
        totalViews: 0,
        totalPurchases: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        purchaseFrequency: 0,
        favoriteCategories: [],
        browsingSessions: 0,
        avgSessionDuration: 0,
      },
    },
    demographics: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    purchasingPower: {
      type: DataTypes.JSON,
      defaultValue: {
        level: 'moderate',
        minPrice: 0,
        maxPrice: 1000,
        avgPrice: 50,
      },
    },
    preferredCategories: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    blockedCategories: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    blockedSellers: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    minPricePreference: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    maxPricePreference: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    recommendationSettings: {
      type: DataTypes.JSON,
      defaultValue: {
        enablePersonalized: true,
        enableTrending: true,
        enableSimilar: true,
        diversityLevel: 0.5,
      },
    },
    completenessScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_profiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['completenessScore'] },
    ],
  }
);

export default UserProfile;
