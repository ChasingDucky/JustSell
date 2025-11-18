import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { VirtualProductCategory, ProductDeliveryType } from '../types/virtualProduct.types';

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SOLD_OUT = 'sold_out',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum ListingType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  UNLIMITED = 'unlimited',
}

interface UserListingAttributes {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: VirtualProductCategory;
  subcategory?: string;
  images: string[];
  price: number;
  currency: string;
  originalPrice?: number;
  discountPercent?: number;
  deliveryType: ProductDeliveryType;
  deliveryTime: number; // in minutes
  autoDelivery: boolean;
  stock: number;
  soldCount: number;
  listingType: ListingType;
  features: string[];
  metadata: any;
  status: ListingStatus;
  rating: number;
  totalReviews: number;
  views: number;
  favorites: number;
  tags: string[];
  termsAndConditions?: string;
  refundPolicy?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  publishedAt?: Date;
  lastStockUpdate?: Date;
  // Physical product attributes
  isPhysicalProduct: boolean;
  requiresShipping?: boolean;
  weight?: number; // in kg
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  shippingOriginCountry?: string;
  shippingOriginPostalCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserListingCreationAttributes
  extends Optional<UserListingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserListing
  extends Model<UserListingAttributes, UserListingCreationAttributes>
  implements UserListingAttributes
{
  public id!: string;
  public sellerId!: string;
  public title!: string;
  public description!: string;
  public category!: VirtualProductCategory;
  public subcategory?: string;
  public images!: string[];
  public price!: number;
  public currency!: string;
  public originalPrice?: number;
  public discountPercent?: number;
  public deliveryType!: ProductDeliveryType;
  public deliveryTime!: number;
  public autoDelivery!: boolean;
  public stock!: number;
  public soldCount!: number;
  public listingType!: ListingType;
  public features!: string[];
  public metadata!: any;
  public status!: ListingStatus;
  public rating!: number;
  public totalReviews!: number;
  public views!: number;
  public favorites!: number;
  public tags!: string[];
  public termsAndConditions?: string;
  public refundPolicy?: string;
  public reviewedBy?: string;
  public reviewNotes?: string;
  public rejectionReason?: string;
  public approvedAt?: Date;
  public rejectedAt?: Date;
  public publishedAt?: Date;
  public lastStockUpdate?: Date;
  // Physical product attributes
  public isPhysicalProduct!: boolean;
  public requiresShipping?: boolean;
  public weight?: number;
  public length?: number;
  public width?: number;
  public height?: number;
  public shippingOriginCountry?: string;
  public shippingOriginPostalCode?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Check if listing is available for purchase
  public isAvailable(): boolean {
    return (
      this.status === ListingStatus.ACTIVE &&
      (this.listingType === ListingType.UNLIMITED || this.stock > 0)
    );
  }

  // Calculate conversion rate
  public getConversionRate(): number {
    return this.views > 0 ? (this.soldCount / this.views) * 100 : 0;
  }

  // Get discount percentage
  public getDiscountPercent(): number {
    if (this.discountPercent) return this.discountPercent;
    if (this.originalPrice && this.originalPrice > this.price) {
      return ((this.originalPrice - this.price) / this.originalPrice) * 100;
    }
    return 0;
  }

  // Decrease stock after purchase
  public async decreaseStock(quantity: number = 1): Promise<void> {
    if (this.listingType === ListingType.UNLIMITED) return;

    if (this.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    this.stock -= quantity;
    this.soldCount += quantity;
    this.lastStockUpdate = new Date();

    if (this.stock === 0) {
      this.status = ListingStatus.SOLD_OUT;
    }

    await this.save();
  }

  // Increase stock
  public async increaseStock(quantity: number = 1): Promise<void> {
    if (this.listingType === ListingType.UNLIMITED) return;

    this.stock += quantity;
    this.lastStockUpdate = new Date();

    if (this.status === ListingStatus.SOLD_OUT && this.stock > 0) {
      this.status = ListingStatus.ACTIVE;
    }

    await this.save();
  }
}

UserListing.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    originalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    deliveryType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deliveryTime: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: 'Delivery time in minutes',
    },
    autoDelivery: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    soldCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    listingType: {
      type: DataTypes.ENUM(...Object.values(ListingType)),
      defaultValue: ListingType.MULTIPLE,
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ListingStatus)),
      defaultValue: ListingStatus.DRAFT,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    favorites: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundPolicy: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastStockUpdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Physical product fields
    isPhysicalProduct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    requiresShipping: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Weight in kilograms',
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Length in centimeters',
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Width in centimeters',
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Height in centimeters',
    },
    shippingOriginCountry: {
      type: DataTypes.STRING(2),
      allowNull: true,
      comment: 'ISO country code for shipping origin',
    },
    shippingOriginPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'user_listings',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['price'] },
      { fields: ['rating'] },
      { fields: ['createdAt'] },
      { fields: ['soldCount'] },
    ],
  }
);

export default UserListing;
