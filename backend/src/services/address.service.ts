import ShippingAddress from '../models/ShippingAddress';
import User from '../models/User';
import { Op } from 'sequelize';

class AddressService {
  // Create shipping address
  async createAddress(data: {
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
    isDefault?: boolean;
    addressType?: 'residential' | 'commercial';
  }) {
    // If setting as default, unset other default addresses
    if (data.isDefault) {
      await ShippingAddress.update(
        { isDefault: false },
        { where: { userId: data.userId, isDefault: true } }
      );
    }

    const address = await ShippingAddress.create(data);
    return address;
  }

  // Get user's addresses
  async getUserAddresses(userId: string) {
    const addresses = await ShippingAddress.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    return addresses;
  }

  // Get address by ID
  async getAddressById(addressId: string, userId: string) {
    const address = await ShippingAddress.findByPk(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Not authorized');
    }

    return address;
  }

  // Get default address
  async getDefaultAddress(userId: string) {
    const address = await ShippingAddress.findOne({
      where: { userId, isDefault: true },
    });

    // If no default, return the first address
    if (!address) {
      return await ShippingAddress.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
    }

    return address;
  }

  // Update address
  async updateAddress(
    addressId: string,
    userId: string,
    data: Partial<ShippingAddress>
  ) {
    const address = await ShippingAddress.findByPk(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Not authorized');
    }

    // If setting as default, unset other default addresses
    if (data.isDefault && !address.isDefault) {
      await ShippingAddress.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    await address.update(data);
    return address;
  }

  // Set default address
  async setDefaultAddress(addressId: string, userId: string) {
    const address = await ShippingAddress.findByPk(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Not authorized');
    }

    // Unset current default
    await ShippingAddress.update(
      { isDefault: false },
      { where: { userId, isDefault: true } }
    );

    // Set new default
    address.isDefault = true;
    await address.save();

    return address;
  }

  // Delete address
  async deleteAddress(addressId: string, userId: string) {
    const address = await ShippingAddress.findByPk(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    if (address.userId !== userId) {
      throw new Error('Not authorized');
    }

    // Don't allow deleting the only address
    const addressCount = await ShippingAddress.count({ where: { userId } });
    if (addressCount === 1) {
      throw new Error('Cannot delete your only address');
    }

    // If deleting default address, set another as default
    if (address.isDefault) {
      const nextAddress = await ShippingAddress.findOne({
        where: { userId, id: { [Op.ne]: addressId } },
        order: [['createdAt', 'DESC']],
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    await address.destroy();
    return { success: true, message: 'Address deleted successfully' };
  }

  // Validate address (basic validation)
  validateAddress(address: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate postal code format (basic)
    if (address.country === 'US') {
      if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
        errors.push('Invalid US postal code format');
      }
    } else if (address.country === 'CN') {
      if (!/^\d{6}$/.test(address.postalCode)) {
        errors.push('Invalid China postal code format');
      }
    } else if (address.country === 'GB') {
      if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(address.postalCode)) {
        errors.push('Invalid UK postal code format');
      }
    }

    // Add more validation as needed

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default new AddressService();
