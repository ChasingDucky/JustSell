import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum MembershipTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ULTIMATE = 'ultimate',
}

export enum MembershipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
}

interface SubONEMembershipAttributes {
  id: string;
  userId: string;
  tier: MembershipTier;
  status: MembershipStatus;
  price: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  familySlots: number;
  usedSlots: number;
  includedServices: string[];
  monthlyBenefit: number; // Total monthly savings
  yearlyBenefit: number; // Total yearly savings
  servicesCount: number; // Number of services included
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubONEMembershipCreationAttributes
  extends Optional<SubONEMembershipAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SubONEMembership
  extends Model<SubONEMembershipAttributes, SubONEMembershipCreationAttributes>
  implements SubONEMembershipAttributes
{
  public id!: string;
  public userId!: string;
  public tier!: MembershipTier;
  public status!: MembershipStatus;
  public price!: number;
  public currency!: string;
  public startDate!: Date;
  public endDate!: Date;
  public autoRenew!: boolean;
  public familySlots!: number;
  public usedSlots!: number;
  public includedServices!: string[];
  public monthlyBenefit!: number;
  public yearlyBenefit!: number;
  public servicesCount!: number;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Get tier benefits
  public static getTierBenefits(tier: MembershipTier) {
    const benefits = {
      [MembershipTier.BASIC]: {
        price: 29.99,
        familySlots: 3,
        services: [
          'Netflix Basic',
          'Spotify Premium',
          'YouTube Premium',
        ],
        servicesCount: 3,
        estimatedMonthlySavings: 20,
        estimatedYearlySavings: 240,
        description: 'Essential streaming services for small families',
      },
      [MembershipTier.PREMIUM]: {
        price: 49.99,
        familySlots: 5,
        services: [
          'Netflix Standard',
          'Spotify Family',
          'YouTube Premium',
          'Disney+',
          'Amazon Prime Video',
        ],
        servicesCount: 5,
        estimatedMonthlySavings: 40,
        estimatedYearlySavings: 480,
        description: 'Popular streaming bundle for medium families',
      },
      [MembershipTier.ULTIMATE]: {
        price: 79.99,
        familySlots: 8,
        services: [
          'Netflix Premium',
          'Spotify Family',
          'YouTube Premium',
          'Disney+',
          'Amazon Prime Video',
          'HBO Max',
          'Apple TV+',
          'Hulu',
        ],
        servicesCount: 8,
        estimatedMonthlySavings: 70,
        estimatedYearlySavings: 840,
        description: 'Complete entertainment package for large families',
      },
    };

    return benefits[tier];
  }

  // Check if membership is active
  public isActive(): boolean {
    return (
      this.status === MembershipStatus.ACTIVE &&
      new Date(this.endDate) > new Date()
    );
  }

  // Check if can add more family members
  public canAddMember(): boolean {
    return this.usedSlots < this.familySlots;
  }

  // Calculate savings compared to individual subscriptions
  public calculateSavings(): { monthly: number; yearly: number } {
    const individual = this.servicesCount * 15; // Assume $15 average per service
    const monthly = individual - this.price;
    const yearly = monthly * 12;
    return { monthly, yearly };
  }

  // Calculate per-person cost
  public getPerPersonCost(): number {
    if (this.usedSlots === 0) return this.price;
    return this.price / this.usedSlots;
  }
}

SubONEMembership.init(
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
    tier: {
      type: DataTypes.ENUM(...Object.values(MembershipTier)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MembershipStatus)),
      defaultValue: MembershipStatus.TRIAL,
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
      allowNull: false,
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    familySlots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Total family member slots available',
    },
    usedSlots: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Number of slots currently used',
    },
    includedServices: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    monthlyBenefit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Monthly savings compared to individual subscriptions',
    },
    yearlyBenefit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Yearly savings compared to individual subscriptions',
    },
    servicesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Number of services included',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'subone_memberships',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['tier'] },
      { fields: ['endDate'] },
    ],
  }
);

export default SubONEMembership;
