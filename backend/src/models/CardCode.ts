import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     CardCode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         cardId:
 *           type: string
 *         code:
 *           type: string
 *         status:
 *           type: string
 *           enum: [available, reserved, sold, used, expired]
 */
export class CardCode extends Model {
  public id!: string;
  public cardId!: string;
  public code!: string;
  public pin?: string;
  public status!: 'available' | 'reserved' | 'sold' | 'used' | 'expired';
  public orderId?: string;
  public reservedAt?: Date;
  public soldAt?: Date;
  public usedAt?: Date;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CardCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cards',
        key: 'id',
      },
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Encrypted card code',
    },
    pin: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted PIN if applicable',
    },
    status: {
      type: DataTypes.ENUM('available', 'reserved', 'sold', 'used', 'expired'),
      allowNull: false,
      defaultValue: 'available',
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    reservedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    soldAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'card_codes',
    timestamps: true,
    indexes: [
      { fields: ['cardId'] },
      { fields: ['status'] },
      { fields: ['orderId'] },
    ],
  }
);
