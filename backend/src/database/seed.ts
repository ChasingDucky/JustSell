import { sequelize } from '../config/database';
import { User, Supplier, Card, CardCode } from '../models';
import { hashPassword } from '../utils/encryption';
import { encryptCard } from '../utils/encryption';
import logger from '../utils/logger';

async function seed() {
  try {
    await sequelize.authenticate();
    logger.info('Starting database seeding...');

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await User.create({
      email: 'admin@cardsky.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });
    logger.info('Admin user created');

    // Create test customer
    const customerPassword = await hashPassword('customer123');
    const customer = await User.create({
      email: 'customer@test.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'customer',
      status: 'active',
      emailVerified: true,
    });
    logger.info('Test customer created');

    // Create supplier user
    const supplierPassword = await hashPassword('supplier123');
    const supplierUser = await User.create({
      email: 'supplier@test.com',
      password: supplierPassword,
      firstName: 'Supplier',
      lastName: 'Company',
      role: 'supplier',
      status: 'active',
      emailVerified: true,
    });

    // Create supplier profile
    const supplier = await Supplier.create({
      userId: supplierUser.id,
      name: 'GameCards Inc.',
      description: 'Leading provider of game cards and digital vouchers',
      contactEmail: 'contact@gamecards.com',
      contactPhone: '+1234567891',
      rating: 4.8,
      status: 'active',
      commissionRate: 10.0,
    });
    logger.info('Test supplier created');

    // Create sample cards
    const cards = [
      {
        supplierId: supplier.id,
        name: 'Steam Gift Card $10',
        description: 'Add funds to your Steam Wallet',
        category: 'game',
        denomination: 10.00,
        price: 9.50,
        discount: 5.00,
        stock: 100,
        imageUrl: '/images/steam-card.jpg',
        tags: ['gaming', 'steam', 'digital'],
        status: 'active' as const,
      },
      {
        supplierId: supplier.id,
        name: 'Steam Gift Card $20',
        description: 'Add funds to your Steam Wallet',
        category: 'game',
        denomination: 20.00,
        price: 18.99,
        discount: 5.00,
        stock: 150,
        imageUrl: '/images/steam-card.jpg',
        tags: ['gaming', 'steam', 'digital'],
        status: 'active' as const,
      },
      {
        supplierId: supplier.id,
        name: 'PlayStation Store $25',
        description: 'PlayStation Network Card',
        category: 'game',
        denomination: 25.00,
        price: 24.00,
        discount: 4.00,
        stock: 80,
        imageUrl: '/images/psn-card.jpg',
        tags: ['gaming', 'playstation', 'psn'],
        status: 'active' as const,
      },
      {
        supplierId: supplier.id,
        name: 'Mobile Recharge $10',
        description: 'Top up your mobile phone',
        category: 'mobile_recharge',
        denomination: 10.00,
        price: 10.00,
        discount: 0,
        stock: 500,
        tags: ['mobile', 'recharge'],
        status: 'active' as const,
      },
      {
        supplierId: supplier.id,
        name: 'Netflix Gift Card $50',
        description: 'Stream unlimited movies and shows',
        category: 'membership',
        denomination: 50.00,
        price: 48.00,
        discount: 4.00,
        stock: 60,
        imageUrl: '/images/netflix-card.jpg',
        tags: ['streaming', 'netflix', 'entertainment'],
        status: 'active' as const,
      },
    ];

    for (const cardData of cards) {
      const card = await Card.create(cardData);
      logger.info(`Card created: ${card.name}`);

      // Generate sample card codes for each card
      for (let i = 0; i < 5; i++) {
        const code = `CARD-${Math.random().toString(36).substr(2, 16).toUpperCase()}`;
        const encryptedCode = encryptCard(code);

        await CardCode.create({
          cardId: card.id,
          code: encryptedCode,
          status: 'available',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        });
      }
      logger.info(`  - Generated 5 card codes`);
    }

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
