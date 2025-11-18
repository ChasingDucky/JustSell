import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         rating:
 *           type: number
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 */
export class Supplier extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public description?: string;
  public contactEmail!: string;
  public contactPhone?: string;
  public apiEndpoint?: string;
  public apiKey?: string;
  public rating!: number;
  public totalSales!: number;
  public status!: 'active' | 'inactive' | 'suspended';
  public settlementAccount?: string;
  public commissionRate!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Supplier.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apiEndpoint: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 5.0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    totalSales: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    settlementAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10.0,
      comment: 'Commission percentage',
    },
  },
  {
    sequelize,
    tableName: 'suppliers',
    timestamps: true,
  }
);
