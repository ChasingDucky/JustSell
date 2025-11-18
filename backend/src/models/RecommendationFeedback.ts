import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum FeedbackType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  MORE_LIKE_THIS = 'more_like_this',
  NOT_INTERESTED = 'not_interested',
  PURCHASED = 'purchased',
  CLICKED = 'clicked',
  IGNORED = 'ignored',
}

export enum RecommendationSource {
  PERSONALIZED = 'personalized',
  COLLABORATIVE = 'collaborative',
  CONTENT_BASED = 'content_based',
  TRENDING = 'trending',
  SIMILAR_ITEMS = 'similar_items',
  HYBRID = 'hybrid',
}

interface RecommendationFeedbackAttributes {
  id: string;
  userId: string;

  // Recommendation details
  recommendationId: string; // Unique ID for this recommendation instance
  itemType: 'card' | 'listing';
  itemId: string;
  recommendationSource: RecommendationSource;
  recommendationScore: number; // Original algorithm score
  position: number; // Position in the recommendation list

  // Feedback
  feedbackType: FeedbackType;
  feedbackValue: number; // -1 (dislike), 0 (neutral), 1 (like)

  // Context
  metadata: {
    category?: string;
    price?: number;
    reasons?: string[]; // Why this was recommended
    alternativesShown?: string[]; // Other items shown at the same time
    [key: string]: any;
  };

  // Timing
  timestamp: Date;
  responseTime?: number; // milliseconds from showing to feedback

  createdAt?: Date;
}

interface RecommendationFeedbackCreationAttributes
  extends Optional<RecommendationFeedbackAttributes, 'id' | 'createdAt'> {}

class RecommendationFeedback
  extends Model<
    RecommendationFeedbackAttributes,
    RecommendationFeedbackCreationAttributes
  >
  implements RecommendationFeedbackAttributes
{
  public id!: string;
  public userId!: string;
  public recommendationId!: string;
  public itemType!: 'card' | 'listing';
  public itemId!: string;
  public recommendationSource!: RecommendationSource;
  public recommendationScore!: number;
  public position!: number;
  public feedbackType!: FeedbackType;
  public feedbackValue!: number;
  public metadata!: {
    category?: string;
    price?: number;
    reasons?: string[];
    alternativesShown?: string[];
    [key: string]: any;
  };
  public timestamp!: Date;
  public responseTime?: number;
  public readonly createdAt!: Date;
}

RecommendationFeedback.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recommendationId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Unique ID for this recommendation instance',
    },
    itemType: {
      type: DataTypes.ENUM('card', 'listing'),
      allowNull: false,
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recommendationSource: {
      type: DataTypes.ENUM(...Object.values(RecommendationSource)),
      allowNull: false,
    },
    recommendationScore: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Original algorithm score (0-1)',
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Position in the recommendation list (1-based)',
    },
    feedbackType: {
      type: DataTypes.ENUM(...Object.values(FeedbackType)),
      allowNull: false,
    },
    feedbackValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '-1 (dislike), 0 (neutral), 1 (like)',
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Milliseconds from showing to feedback',
    },
  },
  {
    sequelize,
    tableName: 'recommendation_feedbacks',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['itemType', 'itemId'] },
      { fields: ['recommendationSource'] },
      { fields: ['feedbackType'] },
      { fields: ['timestamp'] },
    ],
  }
);

export default RecommendationFeedback;
