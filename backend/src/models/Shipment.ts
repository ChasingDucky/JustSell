import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ShipmentProvider {
  IN_HOUSE = 'in_house', // 自营物流
  DHL = 'dhl',
  FEDEX = 'fedex',
  UPS = 'ups',
  USPS = 'usps',
  SF_EXPRESS = 'sf_express', // 顺丰
  CHINA_POST = 'china_post',
  EMS = 'ems',
  ARAMEX = 'aramex',
  TNT = 'tnt',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum ShipmentType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  INTERNATIONAL = 'international',
  INTERNATIONAL_EXPRESS = 'international_express',
}

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

interface ShipmentAttributes {
  id: string;
  orderId: string;
  userId: string;
  sellerId?: string;
  shippingAddressId: string;
  provider: ShipmentProvider;
  shipmentType: ShipmentType;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippingCost: number;
  currency: string;
  weight: number; // in kg
  length?: number; // in cm
  width?: number;
  height?: number;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  signedBy?: string;
  trackingEvents: TrackingEvent[];
  origin: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
  };
  destination: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
  };
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShipmentCreationAttributes
  extends Optional<ShipmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Shipment extends Model<ShipmentAttributes, ShipmentCreationAttributes> implements ShipmentAttributes {
  public id!: string;
  public orderId!: string;
  public userId!: string;
  public sellerId?: string;
  public shippingAddressId!: string;
  public provider!: ShipmentProvider;
  public shipmentType!: ShipmentType;
  public trackingNumber?: string;
  public status!: ShipmentStatus;
  public shippingCost!: number;
  public currency!: string;
  public weight!: number;
  public length?: number;
  public width?: number;
  public height?: number;
  public estimatedDeliveryDate?: Date;
  public actualDeliveryDate?: Date;
  public shippedAt?: Date;
  public deliveredAt?: Date;
  public signedBy?: string;
  public trackingEvents!: TrackingEvent[];
  public origin!: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
  };
  public destination!: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
  };
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Add tracking event
  public async addTrackingEvent(event: TrackingEvent): Promise<void> {
    this.trackingEvents = [...this.trackingEvents, event];

    // Update status based on event
    if (event.status === 'delivered') {
      this.status = ShipmentStatus.DELIVERED;
      this.deliveredAt = event.timestamp;
    } else if (event.status === 'out_for_delivery') {
      this.status = ShipmentStatus.OUT_FOR_DELIVERY;
    } else if (event.status === 'in_transit') {
      this.status = ShipmentStatus.IN_TRANSIT;
    }

    await this.save();
  }

  // Get latest tracking event
  public getLatestEvent(): TrackingEvent | null {
    if (this.trackingEvents.length === 0) return null;
    return this.trackingEvents[this.trackingEvents.length - 1];
  }

  // Check if international shipment
  public isInternational(): boolean {
    return this.origin.country !== this.destination.country;
  }

  // Calculate delivery duration (in days)
  public getDeliveryDuration(): number | null {
    if (!this.shippedAt || !this.deliveredAt) return null;
    const diff = new Date(this.deliveredAt).getTime() - new Date(this.shippedAt).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Calculate volumetric weight
  public getVolumetricWeight(): number | null {
    if (!this.length || !this.width || !this.height) return null;
    // Standard formula: (L × W × H) / 5000
    return (this.length * this.width * this.height) / 5000;
  }

  // Get chargeable weight (higher of actual or volumetric)
  public getChargeableWeight(): number {
    const volumetric = this.getVolumetricWeight();
    return volumetric && volumetric > this.weight ? volumetric : this.weight;
  }
}

Shipment.init(
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
    sellerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sellers',
        key: 'id',
      },
    },
    shippingAddressId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shipping_addresses',
        key: 'id',
      },
    },
    provider: {
      type: DataTypes.ENUM(...Object.values(ShipmentProvider)),
      allowNull: false,
    },
    shipmentType: {
      type: DataTypes.ENUM(...Object.values(ShipmentType)),
      allowNull: false,
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ShipmentStatus)),
      defaultValue: ShipmentStatus.PENDING,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Weight in kg',
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Length in cm',
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Width in cm',
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Height in cm',
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    signedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trackingEvents: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    origin: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    destination: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'shipments',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['trackingNumber'] },
      { fields: ['status'] },
    ],
  }
);

export default Shipment;
