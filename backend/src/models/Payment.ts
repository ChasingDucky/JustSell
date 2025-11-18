import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         orderId:
 *           type: string
 *         amount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 */
export class Payment extends Model {
  public id!: string;
  public orderId!: string;
  public userId!: string;
  public amount!: number;
  public currency!: string;
  public method!: string;
  public provider!: string;
  public transactionId?: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  public metadata?: object;
  public errorMessage?: string;
  public processedAt?: Date;
  public refundedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'card, wallet, bank_transfer',
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'stripe, paypal, alipay, wechat',
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'External transaction ID from payment provider',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['transactionId'] },
    ],
  }
);
