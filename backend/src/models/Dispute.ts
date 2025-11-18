import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum DisputeReason {
  NOT_RECEIVED = 'not_received',
  NOT_AS_DESCRIBED = 'not_as_described',
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  INCOMPLETE = 'incomplete',
  FRAUDULENT = 'fraudulent',
  OTHER = 'other',
}

export enum DisputeResolution {
  REFUND_FULL = 'refund_full',
  REFUND_PARTIAL = 'refund_partial',
  REPLACE_PRODUCT = 'replace_product',
  BUYER_FAVOR = 'buyer_favor',
  SELLER_FAVOR = 'seller_favor',
  MUTUAL_AGREEMENT = 'mutual_agreement',
}

interface DisputeAttributes {
  id: string;
  orderId: string;
  escrowId?: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  reason: DisputeReason;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionNotes?: string;
  refundAmount?: number;
  assignedTo?: string;
  buyerResponse?: string;
  sellerResponse?: string;
  adminNotes?: string;
  openedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DisputeCreationAttributes extends Optional<DisputeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Dispute extends Model<DisputeAttributes, DisputeCreationAttributes> implements DisputeAttributes {
  public id!: string;
  public orderId!: string;
  public escrowId?: string;
  public buyerId!: string;
  public sellerId!: string;
  public listingId!: string;
  public reason!: DisputeReason;
  public description!: string;
  public evidence!: string[];
  public status!: DisputeStatus;
  public resolution?: DisputeResolution;
  public resolutionNotes?: string;
  public refundAmount?: number;
  public assignedTo?: string;
  public buyerResponse?: string;
  public sellerResponse?: string;
  public adminNotes?: string;
  public openedAt!: Date;
  public resolvedAt?: Date;
  public closedAt?: Date;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Resolve dispute
  public async resolve(
    resolution: DisputeResolution,
    notes?: string,
    refundAmount?: number,
    adminId?: string
  ): Promise<void> {
    this.status = DisputeStatus.RESOLVED;
    this.resolution = resolution;
    this.resolutionNotes = notes;
    this.refundAmount = refundAmount;
    this.assignedTo = adminId;
    this.resolvedAt = new Date();
    await this.save();
  }

  // Close dispute
  public async close(): Promise<void> {
    this.status = DisputeStatus.CLOSED;
    this.closedAt = new Date();
    await this.save();
  }

  // Escalate dispute
  public async escalate(adminId: string): Promise<void> {
    this.status = DisputeStatus.ESCALATED;
    this.assignedTo = adminId;
    await this.save();
  }

  // Add evidence
  public async addEvidence(evidenceUrl: string): Promise<void> {
    this.evidence = [...this.evidence, evidenceUrl];
    await this.save();
  }
}

Dispute.init(
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
    escrowId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'escrows',
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
    reason: {
      type: DataTypes.ENUM(...Object.values(DisputeReason)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    evidence: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DisputeStatus)),
      defaultValue: DisputeStatus.OPEN,
    },
    resolution: {
      type: DataTypes.ENUM(...Object.values(DisputeResolution)),
      allowNull: true,
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    buyerResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sellerResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    openedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'disputes',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['buyerId'] },
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['assignedTo'] },
      { fields: ['openedAt'] },
    ],
  }
);

export default Dispute;
