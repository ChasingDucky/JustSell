import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Card:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         denomination:
 *           type: number
 *         price:
 *           type: number
 *         discount:
 *           type: number
 */
export class Card extends Model {
  public id!: string;
  public supplierId!: string;
  public name!: string;
  public description?: string;
  public category!: string;
  public denomination!: number;
  public price!: number;
  public discount!: number;
  public currency!: string;
  public validFrom?: Date;
  public validUntil?: Date;
  public stock!: number;
  public minPurchase!: number;
  public maxPurchase!: number;
  public imageUrl?: string;
  public termsAndConditions?: string;
  public tags?: string[];
  public metadata?: object;
  public rating!: number;
  public reviewCount!: number;
  public status!: 'active' | 'inactive' | 'out_of_stock';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Card.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., game, mobile_recharge, gift, membership',
    },
    denomination: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Face value of the card',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Selling price',
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Discount percentage',
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minPurchase: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    maxPurchase: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0,
      comment: 'Average rating from reviews (0-5)',
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of reviews',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'cards',
    timestamps: true,
    indexes: [
      { fields: ['supplierId'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['price'] },
    ],
  }
);
