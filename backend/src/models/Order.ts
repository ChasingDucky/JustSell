import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         orderNumber:
 *           type: string
 *         userId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, paid, processing, completed, cancelled, refunded]
 */
export class Order extends Model {
  public id!: string;
  public orderNumber!: string;
  public userId!: string;
  public cardId!: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalAmount!: number;
  public discount!: number;
  public finalAmount!: number;
  public currency!: string;
  public status!: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  public paymentMethod?: string;
  public paymentId?: string;
  public deliveryEmail?: string;
  public deliveryPhone?: string;
  public deliveryMethod!: 'email' | 'sms' | 'app';
  public notes?: string;
  public metadata?: object;
  public paidAt?: Date;
  public completedAt?: Date;
  public cancelledAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
      allowNull: false,
      references: {
        model: 'cards',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'stripe, paypal, alipay, wechat',
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryMethod: {
      type: DataTypes.ENUM('email', 'sms', 'app'),
      allowNull: false,
      defaultValue: 'email',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['cardId'] },
      { fields: ['status'] },
      { fields: ['orderNumber'], unique: true },
    ],
  }
);
