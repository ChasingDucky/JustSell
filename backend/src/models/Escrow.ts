import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum EscrowStatus {
  PENDING = 'pending',
  FUNDED = 'funded',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

interface EscrowAttributes {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  currency: string;
  platformFee: number;
  sellerAmount: number;
  status: EscrowStatus;
  paymentId?: string;
  releaseCondition: string;
  autoReleaseAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  disputeId?: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EscrowCreationAttributes extends Optional<EscrowAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Escrow extends Model<EscrowAttributes, EscrowCreationAttributes> implements EscrowAttributes {
  public id!: string;
  public orderId!: string;
  public buyerId!: string;
  public sellerId!: string;
  public listingId!: string;
  public amount!: number;
  public currency!: string;
  public platformFee!: number;
  public sellerAmount!: number;
  public status!: EscrowStatus;
  public paymentId?: string;
  public releaseCondition!: string;
  public autoReleaseAt?: Date;
  public releasedAt?: Date;
  public refundedAt?: Date;
  public disputeId?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Check if escrow can be released
  public canRelease(): boolean {
    return this.status === EscrowStatus.FUNDED;
  }

  // Check if escrow can be refunded
  public canRefund(): boolean {
    return [EscrowStatus.PENDING, EscrowStatus.FUNDED].includes(this.status);
  }

  // Release funds to seller
  public async release(): Promise<void> {
    if (!this.canRelease()) {
      throw new Error(`Cannot release escrow in status: ${this.status}`);
    }

    this.status = EscrowStatus.RELEASED;
    this.releasedAt = new Date();
    await this.save();
  }

  // Refund to buyer
  public async refund(): Promise<void> {
    if (!this.canRefund()) {
      throw new Error(`Cannot refund escrow in status: ${this.status}`);
    }

    this.status = EscrowStatus.REFUNDED;
    this.refundedAt = new Date();
    await this.save();
  }

  // Mark as disputed
  public async dispute(disputeId: string): Promise<void> {
    this.status = EscrowStatus.DISPUTED;
    this.disputeId = disputeId;
    await this.save();
  }
}

Escrow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'id',
      },
    },
    listingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_listings',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    platformFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sellerAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EscrowStatus)),
      defaultValue: EscrowStatus.PENDING,
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id',
      },
    },
    releaseCondition: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'delivery_confirmed',
    },
    autoReleaseAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Auto-release funds to seller at this time if no dispute',
    },
    releasedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disputeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'escrows',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['buyerId'] },
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['autoReleaseAt'] },
    ],
  }
);

export default Escrow;
