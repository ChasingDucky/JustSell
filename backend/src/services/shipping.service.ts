import Shipment, { ShipmentProvider, ShipmentStatus, ShipmentType } from '../models/Shipment';
import ShippingAddress from '../models/ShippingAddress';
import Order from '../models/Order';
import User from '../models/User';
import { Op } from 'sequelize';

interface ShippingRate {
  provider: ShipmentProvider;
  shipmentType: ShipmentType;
  cost: number;
  currency: string;
  estimatedDays: number;
  description: string;
}

interface PackageDimensions {
  weight: number; // kg
  length?: number; // cm
  width?: number;
  height?: number;
}

class ShippingService {
  // Calculate shipping rates
  async calculateShippingRates(
    origin: { country: string; postalCode: string },
    destination: { country: string; postalCode: string },
    packageDimensions: PackageDimensions
  ): Promise<ShippingRate[]> {
    const isInternational = origin.country !== destination.country;
    const weight = packageDimensions.weight;
    const volumetricWeight = this.calculateVolumetricWeight(packageDimensions);
    const chargeableWeight = Math.max(weight, volumetricWeight || 0);

    const rates: ShippingRate[] = [];

    if (!isInternational) {
      // Domestic shipping options

      // In-house standard shipping
      rates.push({
        provider: ShipmentProvider.IN_HOUSE,
        shipmentType: ShipmentType.STANDARD,
        cost: this.calculateInHouseRate(chargeableWeight, false),
        currency: 'USD',
        estimatedDays: 5,
        description: 'Self-operated Standard Shipping',
      });

      // In-house express
      rates.push({
        provider: ShipmentProvider.IN_HOUSE,
        shipmentType: ShipmentType.EXPRESS,
        cost: this.calculateInHouseRate(chargeableWeight, true),
        currency: 'USD',
        estimatedDays: 2,
        description: 'Self-operated Express Shipping',
      });

      // USPS
      rates.push({
        provider: ShipmentProvider.USPS,
        shipmentType: ShipmentType.STANDARD,
        cost: 5.99 + chargeableWeight * 0.5,
        currency: 'USD',
        estimatedDays: 5,
        description: 'USPS Priority Mail',
      });

      // FedEx
      rates.push({
        provider: ShipmentProvider.FEDEX,
        shipmentType: ShipmentType.EXPRESS,
        cost: 12.99 + chargeableWeight * 1.2,
        currency: 'USD',
        estimatedDays: 2,
        description: 'FedEx 2-Day',
      });

      // UPS
      rates.push({
        provider: ShipmentProvider.UPS,
        shipmentType: ShipmentType.OVERNIGHT,
        cost: 24.99 + chargeableWeight * 2.5,
        currency: 'USD',
        estimatedDays: 1,
        description: 'UPS Next Day Air',
      });
    } else {
      // International shipping options

      // In-house international
      rates.push({
        provider: ShipmentProvider.IN_HOUSE,
        shipmentType: ShipmentType.INTERNATIONAL,
        cost: this.calculateInternationalRate(chargeableWeight, destination.country, false),
        currency: 'USD',
        estimatedDays: 15,
        description: 'Self-operated International Standard',
      });

      // DHL Express
      rates.push({
        provider: ShipmentProvider.DHL,
        shipmentType: ShipmentType.INTERNATIONAL_EXPRESS,
        cost: 35.99 + chargeableWeight * 8.5,
        currency: 'USD',
        estimatedDays: 5,
        description: 'DHL Express Worldwide',
      });

      // FedEx International
      rates.push({
        provider: ShipmentProvider.FEDEX,
        shipmentType: ShipmentType.INTERNATIONAL_EXPRESS,
        cost: 39.99 + chargeableWeight * 9.0,
        currency: 'USD',
        estimatedDays: 4,
        description: 'FedEx International Priority',
      });

      // UPS Worldwide
      rates.push({
        provider: ShipmentProvider.UPS,
        shipmentType: ShipmentType.INTERNATIONAL_EXPRESS,
        cost: 42.99 + chargeableWeight * 9.5,
        currency: 'USD',
        estimatedDays: 4,
        description: 'UPS Worldwide Express',
      });

      // China Post (for Asia destinations)
      if (this.isAsiaDestination(destination.country)) {
        rates.push({
          provider: ShipmentProvider.CHINA_POST,
          shipmentType: ShipmentType.INTERNATIONAL,
          cost: 18.99 + chargeableWeight * 4.0,
          currency: 'USD',
          estimatedDays: 20,
          description: 'China Post Air Mail',
        });

        rates.push({
          provider: ShipmentProvider.SF_EXPRESS,
          shipmentType: ShipmentType.INTERNATIONAL_EXPRESS,
          cost: 28.99 + chargeableWeight * 6.5,
          currency: 'USD',
          estimatedDays: 7,
          description: 'SF Express International',
        });
      }

      // EMS
      rates.push({
        provider: ShipmentProvider.EMS,
        shipmentType: ShipmentType.INTERNATIONAL,
        cost: 25.99 + chargeableWeight * 5.5,
        currency: 'USD',
        estimatedDays: 10,
        description: 'EMS Express Mail Service',
      });
    }

    return rates.sort((a, b) => a.cost - b.cost);
  }

  // Calculate in-house shipping rate
  private calculateInHouseRate(weight: number, express: boolean): number {
    const baseRate = express ? 8.99 : 4.99;
    const perKgRate = express ? 1.5 : 0.8;
    return baseRate + weight * perKgRate;
  }

  // Calculate international shipping rate
  private calculateInternationalRate(weight: number, country: string, express: boolean): number {
    let baseRate = 15.99;
    let perKgRate = 5.0;

    // Zone-based pricing
    if (this.isAsiaDestination(country)) {
      baseRate = express ? 25.99 : 12.99;
      perKgRate = express ? 6.0 : 3.5;
    } else if (this.isEuropeDestination(country)) {
      baseRate = express ? 28.99 : 15.99;
      perKgRate = express ? 7.0 : 4.5;
    } else {
      baseRate = express ? 32.99 : 18.99;
      perKgRate = express ? 8.0 : 5.5;
    }

    return baseRate + weight * perKgRate;
  }

  // Calculate volumetric weight
  private calculateVolumetricWeight(dimensions: PackageDimensions): number | null {
    if (!dimensions.length || !dimensions.width || !dimensions.height) return null;
    return (dimensions.length * dimensions.width * dimensions.height) / 5000;
  }

  // Check if destination is in Asia
  private isAsiaDestination(country: string): boolean {
    const asiaCountries = ['CN', 'JP', 'KR', 'SG', 'HK', 'TW', 'TH', 'VN', 'MY', 'ID', 'PH', 'IN'];
    return asiaCountries.includes(country.toUpperCase());
  }

  // Check if destination is in Europe
  private isEuropeDestination(country: string): boolean {
    const europeCountries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'PL'];
    return europeCountries.includes(country.toUpperCase());
  }

  // Create shipment
  async createShipment(data: {
    orderId: string;
    userId: string;
    sellerId?: string;
    shippingAddressId: string;
    provider: ShipmentProvider;
    shipmentType: ShipmentType;
    packageDimensions: PackageDimensions;
    origin: { country: string; state: string; city: string; postalCode: string };
  }) {
    // Get shipping address
    const shippingAddress = await ShippingAddress.findByPk(data.shippingAddressId);
    if (!shippingAddress) {
      throw new Error('Shipping address not found');
    }

    // Calculate shipping cost
    const rates = await this.calculateShippingRates(
      data.origin,
      {
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
      },
      data.packageDimensions
    );

    const selectedRate = rates.find(
      (r) => r.provider === data.provider && r.shipmentType === data.shipmentType
    );

    if (!selectedRate) {
      throw new Error('Invalid shipping provider or type');
    }

    // Calculate estimated delivery date
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + selectedRate.estimatedDays);

    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber(data.provider);

    // Create shipment
    const shipment = await Shipment.create({
      orderId: data.orderId,
      userId: data.userId,
      sellerId: data.sellerId,
      shippingAddressId: data.shippingAddressId,
      provider: data.provider,
      shipmentType: data.shipmentType,
      trackingNumber,
      status: ShipmentStatus.PENDING,
      shippingCost: selectedRate.cost,
      currency: selectedRate.currency,
      weight: data.packageDimensions.weight,
      length: data.packageDimensions.length,
      width: data.packageDimensions.width,
      height: data.packageDimensions.height,
      estimatedDeliveryDate,
      trackingEvents: [],
      origin: data.origin,
      destination: {
        country: shippingAddress.country,
        state: shippingAddress.state,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
      },
    });

    return shipment;
  }

  // Generate tracking number
  private generateTrackingNumber(provider: ShipmentProvider): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = {
      [ShipmentProvider.IN_HOUSE]: 'JH',
      [ShipmentProvider.DHL]: 'DHL',
      [ShipmentProvider.FEDEX]: 'FX',
      [ShipmentProvider.UPS]: 'UPS',
      [ShipmentProvider.USPS]: 'USPS',
      [ShipmentProvider.SF_EXPRESS]: 'SF',
      [ShipmentProvider.CHINA_POST]: 'CP',
      [ShipmentProvider.EMS]: 'EMS',
      [ShipmentProvider.ARAMEX]: 'ARX',
      [ShipmentProvider.TNT]: 'TNT',
    }[provider];

    return `${prefix}${timestamp}${random}`;
  }

  // Update shipment status
  async updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    location?: string,
    description?: string
  ) {
    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // Add tracking event
    await shipment.addTrackingEvent({
      timestamp: new Date(),
      status,
      location: location || 'Unknown',
      description: description || this.getStatusDescription(status),
    });

    // Update timestamps
    if (status === ShipmentStatus.PICKED_UP && !shipment.shippedAt) {
      shipment.shippedAt = new Date();
    }

    if (status === ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = new Date();
      shipment.actualDeliveryDate = new Date();
    }

    await shipment.save();
    return shipment;
  }

  // Get status description
  private getStatusDescription(status: ShipmentStatus): string {
    const descriptions: Record<ShipmentStatus, string> = {
      [ShipmentStatus.PENDING]: 'Shipment created, awaiting processing',
      [ShipmentStatus.PROCESSING]: 'Package is being processed',
      [ShipmentStatus.PICKED_UP]: 'Package picked up by carrier',
      [ShipmentStatus.IN_TRANSIT]: 'Package is in transit',
      [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for delivery',
      [ShipmentStatus.DELIVERED]: 'Package delivered',
      [ShipmentStatus.FAILED]: 'Delivery attempt failed',
      [ShipmentStatus.RETURNED]: 'Package returned to sender',
      [ShipmentStatus.CANCELLED]: 'Shipment cancelled',
    };
    return descriptions[status];
  }

  // Track shipment
  async trackShipment(trackingNumber: string) {
    const shipment = await Shipment.findOne({
      where: { trackingNumber },
      include: [
        {
          model: ShippingAddress,
          as: 'shippingAddress',
        },
        {
          model: Order,
          as: 'order',
        },
      ],
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return {
      shipment,
      currentStatus: shipment.status,
      latestEvent: shipment.getLatestEvent(),
      allEvents: shipment.trackingEvents,
      estimatedDelivery: shipment.estimatedDeliveryDate,
      isDelivered: shipment.status === ShipmentStatus.DELIVERED,
    };
  }

  // Get user's shipments
  async getUserShipments(userId: string, status?: ShipmentStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const shipments = await Shipment.findAll({
      where,
      include: [
        {
          model: ShippingAddress,
          as: 'shippingAddress',
        },
        {
          model: Order,
          as: 'order',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return shipments;
  }

  // Confirm delivery
  async confirmDelivery(shipmentId: string, userId: string, signedBy?: string) {
    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new Error('Not authorized');
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new Error('Shipment already delivered');
    }

    shipment.signedBy = signedBy || 'Customer';
    await this.updateShipmentStatus(
      shipmentId,
      ShipmentStatus.DELIVERED,
      'Customer Location',
      `Signed by ${signedBy || 'Customer'}`
    );

    return shipment;
  }

  // Cancel shipment
  async cancelShipment(shipmentId: string, userId: string, reason?: string) {
    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (shipment.userId !== userId && shipment.sellerId !== userId) {
      throw new Error('Not authorized');
    }

    if ([ShipmentStatus.DELIVERED, ShipmentStatus.IN_TRANSIT].includes(shipment.status)) {
      throw new Error('Cannot cancel shipment in current status');
    }

    await this.updateShipmentStatus(
      shipmentId,
      ShipmentStatus.CANCELLED,
      'Warehouse',
      reason || 'Shipment cancelled by user'
    );

    return shipment;
  }
}

export default new ShippingService();
