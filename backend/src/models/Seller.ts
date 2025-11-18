import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum SellerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum SellerLevel {
  NEWCOMER = 'newcomer',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

interface SellerAttributes {
  id: string;
  userId: string;
  storeName: string;
  description?: string;
  logo?: string;
  status: SellerStatus;
  level: SellerLevel;
  verified: boolean;
  rating: number;
  totalSales: number;
  totalRevenue: number;
  completionRate: number;
  responseTime: number; // in minutes
  totalReviews: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  businessLicense?: string;
  idVerification?: string;
  bankAccount?: string;
  paypalEmail?: string;
  cryptoAddress?: string;
  metadata?: any;
  approvedAt?: Date;
  suspendedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SellerCreationAttributes extends Optional<SellerAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Seller extends Model<SellerAttributes, SellerCreationAttributes> implements SellerAttributes {
  public id!: string;
  public userId!: string;
  public storeName!: string;
  public description?: string;
  public logo?: string;
  public status!: SellerStatus;
  public level!: SellerLevel;
  public verified!: boolean;
  public rating!: number;
  public totalSales!: number;
  public totalRevenue!: number;
  public completionRate!: number;
  public responseTime!: number;
  public totalReviews!: number;
  public positiveReviews!: number;
  public neutralReviews!: number;
  public negativeReviews!: number;
  public businessLicense?: string;
  public idVerification?: string;
  public bankAccount?: string;
  public paypalEmail?: string;
  public cryptoAddress?: string;
  public metadata?: any;
  public approvedAt?: Date;
  public suspendedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calculate seller reputation score
  public getReputationScore(): number {
    const ratingWeight = 0.4;
    const completionWeight = 0.3;
    const reviewWeight = 0.3;

    const ratingScore = (this.rating / 5) * 100;
    const completionScore = this.completionRate;
    const reviewScore = this.totalReviews > 0
      ? (this.positiveReviews / this.totalReviews) * 100
      : 0;

    return (
      ratingScore * ratingWeight +
      completionScore * completionWeight +
      reviewScore * reviewWeight
    );
  }

  // Determine if seller can upgrade level
  public canUpgradeLevel(): boolean {
    const requirements = {
      bronze: { sales: 10, rating: 4.0, completion: 90 },
      silver: { sales: 50, rating: 4.3, completion: 92 },
      gold: { sales: 200, rating: 4.5, completion: 95 },
      platinum: { sales: 500, rating: 4.7, completion: 97 },
      diamond: { sales: 1000, rating: 4.9, completion: 98 },
    };

    const nextLevel = this.getNextLevel();
    if (!nextLevel) return false;

    const req = requirements[nextLevel as keyof typeof requirements];
    return (
      this.totalSales >= req.sales &&
      this.rating >= req.rating &&
      this.completionRate >= req.completion
    );
  }

  private getNextLevel(): SellerLevel | null {
    const levels = [
      SellerLevel.NEWCOMER,
      SellerLevel.BRONZE,
      SellerLevel.SILVER,
      SellerLevel.GOLD,
      SellerLevel.PLATINUM,
      SellerLevel.DIAMOND,
    ];
    const currentIndex = levels.indexOf(this.level);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }
}

Seller.init(
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
    storeName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SellerStatus)),
      defaultValue: SellerStatus.PENDING,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM(...Object.values(SellerLevel)),
      defaultValue: SellerLevel.NEWCOMER,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    totalSales: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    completionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Average response time in minutes',
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    positiveReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    neutralReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    negativeReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    businessLicense: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Business license document URL',
    },
    idVerification: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID verification document URL',
    },
    bankAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paypalEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cryptoAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    suspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sellers',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['level'] },
      { fields: ['verified'] },
      { fields: ['rating'] },
    ],
  }
);

export default Seller;
