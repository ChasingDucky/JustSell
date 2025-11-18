import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum BehaviorType {
  VIEW = 'view',
  CLICK = 'click',
  SEARCH = 'search',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  PURCHASE = 'purchase',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  REVIEW = 'review',
  SHARE = 'share',
}

interface UserBehaviorAttributes {
  id: string;
  userId: string;

  // Behavior type
  behaviorType: BehaviorType;

  // Target information
  targetType: 'card' | 'listing' | 'seller' | 'category';
  targetId: string;

  // Metadata
  metadata: {
    category?: string;
    subcategory?: string;
    price?: number;
    searchQuery?: string;
    duration?: number; // seconds spent on page
    source?: string; // where the user came from
    deviceType?: string;
    [key: string]: any;
  };

  // Context
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;

  // Timestamp
  timestamp: Date;

  createdAt?: Date;
}

interface UserBehaviorCreationAttributes
  extends Optional<UserBehaviorAttributes, 'id' | 'createdAt'> {}

class UserBehavior
  extends Model<UserBehaviorAttributes, UserBehaviorCreationAttributes>
  implements UserBehaviorAttributes
{
  public id!: string;
  public userId!: string;
  public behaviorType!: BehaviorType;
  public targetType!: 'card' | 'listing' | 'seller' | 'category';
  public targetId!: string;
  public metadata!: {
    category?: string;
    subcategory?: string;
    price?: number;
    searchQuery?: string;
    duration?: number;
    source?: string;
    deviceType?: string;
    [key: string]: any;
  };
  public sessionId?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
}

UserBehavior.init(
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
    behaviorType: {
      type: DataTypes.ENUM(...Object.values(BehaviorType)),
      allowNull: false,
    },
    targetType: {
      type: DataTypes.ENUM('card', 'listing', 'seller', 'category'),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_behaviors',
    timestamps: true,
    updatedAt: false, // Only need createdAt for behavior logs
    indexes: [
      { fields: ['userId'] },
      { fields: ['behaviorType'] },
      { fields: ['targetType', 'targetId'] },
      { fields: ['timestamp'] },
      { fields: ['sessionId'] },
    ],
  }
);

export default UserBehavior;
