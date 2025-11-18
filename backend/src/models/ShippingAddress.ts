import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShippingAddressAttributes {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  address2?: string;
  postalCode: string;
  isDefault: boolean;
  addressType: 'residential' | 'commercial';
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShippingAddressCreationAttributes
  extends Optional<ShippingAddressAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ShippingAddress
  extends Model<ShippingAddressAttributes, ShippingAddressCreationAttributes>
  implements ShippingAddressAttributes
{
  public id!: string;
  public userId!: string;
  public name!: string;
  public phone!: string;
  public email?: string;
  public country!: string;
  public state!: string;
  public city!: string;
  public address!: string;
  public address2?: string;
  public postalCode!: string;
  public isDefault!: boolean;
  public addressType!: 'residential' | 'commercial';
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Get full address string
  public getFullAddress(): string {
    const parts = [
      this.address,
      this.address2,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  // Check if international address
  public isInternational(baseCountry: string = 'US'): boolean {
    return this.country !== baseCountry;
  }
}

ShippingAddress.init(
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
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    addressType: {
      type: DataTypes.ENUM('residential', 'commercial'),
      defaultValue: 'residential',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'shipping_addresses',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isDefault'] },
    ],
  }
);

export default ShippingAddress;
