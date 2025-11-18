import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING_RENEWAL = 'pending_renewal',
}

export enum SubscriptionCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum SubscriptionCategory {
  STREAMING = 'streaming',
  MUSIC = 'music',
  GAMING = 'gaming',
  SOFTWARE = 'software',
  VPN = 'vpn',
  CLOUD = 'cloud',
  OTHER = 'other',
}

interface SubscriptionAttributes {
  id: string;
  userId: string;
  cardId?: string;
  orderId?: string;
  listingId?: string;
  name: string;
  category: SubscriptionCategory;
  provider: string;
  status: SubscriptionStatus;
  cycle: SubscriptionCycle;
  price: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  autoRenew: boolean;
  renewalReminder: boolean;
  monthlyEquivalent: number; // For comparison across different cycles
  yearlyTotal: number; // Annual cost
  sharedWith?: number; // Number of people sharing
  savingsOpportunity?: number; // Potential savings amount
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubscriptionCreationAttributes
  extends Optional<SubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: string;
  public userId!: string;
  public cardId?: string;
  public orderId?: string;
  public listingId?: string;
  public name!: string;
  public category!: SubscriptionCategory;
  public provider!: string;
  public status!: SubscriptionStatus;
  public cycle!: SubscriptionCycle;
  public price!: number;
  public currency!: string;
  public startDate!: Date;
  public endDate?: Date;
  public nextBillingDate?: Date;
  public autoRenew!: boolean;
  public renewalReminder!: boolean;
  public monthlyEquivalent!: number;
  public yearlyTotal!: number;
  public sharedWith?: number;
  public savingsOpportunity?: number;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calculate monthly equivalent cost
  public static calculateMonthlyEquivalent(price: number, cycle: SubscriptionCycle): number {
    switch (cycle) {
      case SubscriptionCycle.MONTHLY:
        return price;
      case SubscriptionCycle.QUARTERLY:
        return price / 3;
      case SubscriptionCycle.YEARLY:
        return price / 12;
      case SubscriptionCycle.LIFETIME:
        return price / 60; // Assume 5 years
      default:
        return price;
    }
  }

  // Calculate yearly total cost
  public static calculateYearlyTotal(price: number, cycle: SubscriptionCycle): number {
    switch (cycle) {
      case SubscriptionCycle.MONTHLY:
        return price * 12;
      case SubscriptionCycle.QUARTERLY:
        return price * 4;
      case SubscriptionCycle.YEARLY:
        return price;
      case SubscriptionCycle.LIFETIME:
        return price; // One-time payment
      default:
        return price * 12;
    }
  }

  // Check if subscription is expiring soon (within 7 days)
  public isExpiringSoon(): boolean {
    if (!this.nextBillingDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(this.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  // Check if subscription has expired
  public isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date(this.endDate) < new Date();
  }

  // Update status based on dates
  public async updateStatus(): Promise<void> {
    if (this.isExpired() && this.status !== SubscriptionStatus.CANCELLED) {
      this.status = SubscriptionStatus.EXPIRED;
    } else if (this.isExpiringSoon() && this.autoRenew) {
      this.status = SubscriptionStatus.PENDING_RENEWAL;
    }
    await this.save();
  }
}

Subscription.init(
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
    cardId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cards',
        key: 'id',
      },
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    listingId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'user_listings',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(SubscriptionCategory)),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      defaultValue: SubscriptionStatus.ACTIVE,
    },
    cycle: {
      type: DataTypes.ENUM(...Object.values(SubscriptionCycle)),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    renewalReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    monthlyEquivalent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    yearlyTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sharedWith: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of people sharing this subscription',
    },
    savingsOpportunity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Potential savings if switched to better plan',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['nextBillingDate'] },
    ],
  }
);

export default Subscription;
