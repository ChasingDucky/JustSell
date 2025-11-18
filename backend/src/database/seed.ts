import { sequelize } from '../config/database';
import { User, Supplier, Card, CardCode, Order, Payment } from '../models';
import { hashPassword } from '../utils/encryption';
import { encryptCard, generateCardCode } from '../utils/encryption';
import logger from '../utils/logger';

async function seed() {
  try {
    await sequelize.authenticate();
    logger.info('Starting database seeding...');

    // ========== USERS ==========

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
    logger.info('✓ Admin user created');

    // Create multiple test customers
    const customerPassword = await hashPassword('customer123');
    const customers = await Promise.all([
      User.create({
        email: 'john.doe@test.com',
        password: customerPassword,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      }),
      User.create({
        email: 'jane.smith@test.com',
        password: customerPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567891',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      }),
      User.create({
        email: 'mike.wilson@test.com',
        password: customerPassword,
        firstName: 'Mike',
        lastName: 'Wilson',
        phone: '+1234567892',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      }),
      User.create({
        email: 'sarah.jones@test.com',
        password: customerPassword,
        firstName: 'Sarah',
        lastName: 'Jones',
        phone: '+1234567893',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      }),
    ]);
    logger.info(`✓ ${customers.length} test customers created`);

    // ========== SUPPLIERS ==========

    const supplierPassword = await hashPassword('supplier123');

    // Supplier 1: GameCards Inc.
    const supplier1User = await User.create({
      email: 'supplier1@cardsky.com',
      password: supplierPassword,
      firstName: 'GameCards',
      lastName: 'Inc',
      role: 'supplier',
      status: 'active',
      emailVerified: true,
    });
    const supplier1 = await Supplier.create({
      userId: supplier1User.id,
      name: 'GameCards Inc.',
      description: 'Leading provider of game cards and digital vouchers',
      contactEmail: 'contact@gamecards.com',
      contactPhone: '+1234567891',
      rating: 4.8,
      totalSales: 15234,
      status: 'active',
      commissionRate: 10.0,
    });

    // Supplier 2: Digital Dreams
    const supplier2User = await User.create({
      email: 'supplier2@cardsky.com',
      password: supplierPassword,
      firstName: 'Digital',
      lastName: 'Dreams',
      role: 'supplier',
      status: 'active',
      emailVerified: true,
    });
    const supplier2 = await Supplier.create({
      userId: supplier2User.id,
      name: 'Digital Dreams',
      description: 'Premium entertainment and streaming cards',
      contactEmail: 'info@digitaldreams.com',
      contactPhone: '+1234567892',
      rating: 4.9,
      totalSales: 8956,
      status: 'active',
      commissionRate: 8.0,
    });

    // Supplier 3: Mobile Masters
    const supplier3User = await User.create({
      email: 'supplier3@cardsky.com',
      password: supplierPassword,
      firstName: 'Mobile',
      lastName: 'Masters',
      role: 'supplier',
      status: 'active',
      emailVerified: true,
    });
    const supplier3 = await Supplier.create({
      userId: supplier3User.id,
      name: 'Mobile Masters',
      description: 'Top-up and recharge solutions worldwide',
      contactEmail: 'support@mobilemasters.com',
      contactPhone: '+1234567893',
      rating: 4.7,
      totalSales: 23456,
      status: 'active',
      commissionRate: 5.0,
    });

    // Supplier 4: Gift Galaxy
    const supplier4User = await User.create({
      email: 'supplier4@cardsky.com',
      password: supplierPassword,
      firstName: 'Gift',
      lastName: 'Galaxy',
      role: 'supplier',
      status: 'active',
      emailVerified: true,
    });
    const supplier4 = await Supplier.create({
      userId: supplier4User.id,
      name: 'Gift Galaxy',
      description: 'Your one-stop shop for all gift cards',
      contactEmail: 'hello@giftgalaxy.com',
      contactPhone: '+1234567894',
      rating: 4.6,
      totalSales: 12789,
      status: 'active',
      commissionRate: 12.0,
    });

    logger.info('✓ 4 suppliers created');

    // ========== CARDS ==========

    const cardsData = [
      // Gaming Cards - Supplier 1
      {
        supplierId: supplier1.id,
        name: 'Steam Gift Card $10',
        description: 'Add $10 to your Steam Wallet. Perfect for indie games and sales!',
        category: 'game',
        denomination: 10.00,
        price: 9.50,
        discount: 5.00,
        stock: 150,
        tags: ['gaming', 'steam', 'pc', 'digital'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'Steam Gift Card $20',
        description: 'Add $20 to your Steam Wallet. Great for AAA titles!',
        category: 'game',
        denomination: 20.00,
        price: 18.99,
        discount: 5.05,
        stock: 200,
        tags: ['gaming', 'steam', 'pc', 'digital'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'Steam Gift Card $50',
        description: 'Add $50 to your Steam Wallet. Best value!',
        category: 'game',
        denomination: 50.00,
        price: 47.00,
        discount: 6.00,
        stock: 100,
        tags: ['gaming', 'steam', 'pc', 'digital', 'bestseller'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'PlayStation Store $25',
        description: 'PlayStation Network Card - Buy games, add-ons and more',
        category: 'game',
        denomination: 25.00,
        price: 24.00,
        discount: 4.00,
        stock: 120,
        tags: ['gaming', 'playstation', 'psn', 'console'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'PlayStation Store $50',
        description: 'PlayStation Network Card - Premium gaming experience',
        category: 'game',
        denomination: 50.00,
        price: 48.50,
        discount: 3.00,
        stock: 80,
        tags: ['gaming', 'playstation', 'psn', 'console'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'Xbox Gift Card $15',
        description: 'Buy the latest Xbox games and entertainment',
        category: 'game',
        denomination: 15.00,
        price: 14.50,
        discount: 3.33,
        stock: 90,
        tags: ['gaming', 'xbox', 'microsoft', 'console'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'Xbox Gift Card $25',
        description: 'Unlock a world of games and entertainment on Xbox',
        category: 'game',
        denomination: 25.00,
        price: 24.25,
        discount: 3.00,
        stock: 110,
        tags: ['gaming', 'xbox', 'microsoft', 'console'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'Nintendo eShop $20',
        description: 'Download games and DLC for Nintendo Switch',
        category: 'game',
        denomination: 20.00,
        price: 19.50,
        discount: 2.50,
        stock: 95,
        tags: ['gaming', 'nintendo', 'switch', 'eshop'],
        status: 'active' as const,
      },
      {
        supplierId: supplier1.id,
        name: 'Nintendo eShop $35',
        description: 'Get the latest Nintendo games and content',
        category: 'game',
        denomination: 35.00,
        price: 34.00,
        discount: 2.86,
        stock: 70,
        tags: ['gaming', 'nintendo', 'switch', 'eshop'],
        status: 'active' as const,
      },

      // Entertainment - Supplier 2
      {
        supplierId: supplier2.id,
        name: 'Netflix Gift Card $30',
        description: 'Stream unlimited movies and TV shows',
        category: 'membership',
        denomination: 30.00,
        price: 29.00,
        discount: 3.33,
        stock: 150,
        tags: ['streaming', 'netflix', 'entertainment', 'movies'],
        status: 'active' as const,
      },
      {
        supplierId: supplier2.id,
        name: 'Netflix Gift Card $60',
        description: '2 months of premium streaming entertainment',
        category: 'membership',
        denomination: 60.00,
        price: 57.00,
        discount: 5.00,
        stock: 100,
        tags: ['streaming', 'netflix', 'entertainment', 'movies', 'popular'],
        status: 'active' as const,
      },
      {
        supplierId: supplier2.id,
        name: 'Spotify Premium $30',
        description: '3 months of ad-free music streaming',
        category: 'membership',
        denomination: 30.00,
        price: 28.50,
        discount: 5.00,
        stock: 200,
        tags: ['music', 'spotify', 'streaming', 'premium'],
        status: 'active' as const,
      },
      {
        supplierId: supplier2.id,
        name: 'Disney+ Gift Card $25',
        description: 'Access Disney, Pixar, Marvel, Star Wars & more',
        category: 'membership',
        denomination: 25.00,
        price: 24.00,
        discount: 4.00,
        stock: 80,
        tags: ['streaming', 'disney', 'entertainment', 'family'],
        status: 'active' as const,
      },
      {
        supplierId: supplier2.id,
        name: 'HBO Max Gift Card $50',
        description: 'Premium series and blockbuster movies',
        category: 'membership',
        denomination: 50.00,
        price: 48.00,
        discount: 4.00,
        stock: 60,
        tags: ['streaming', 'hbo', 'entertainment', 'premium'],
        status: 'active' as const,
      },

      // Mobile Recharge - Supplier 3
      {
        supplierId: supplier3.id,
        name: 'AT&T Prepaid $10',
        description: 'Top up your AT&T prepaid account instantly',
        category: 'mobile_recharge',
        denomination: 10.00,
        price: 10.00,
        discount: 0,
        stock: 500,
        tags: ['mobile', 'recharge', 'att', 'prepaid'],
        status: 'active' as const,
      },
      {
        supplierId: supplier3.id,
        name: 'AT&T Prepaid $25',
        description: 'AT&T prepaid refill - Fast delivery',
        category: 'mobile_recharge',
        denomination: 25.00,
        price: 25.00,
        discount: 0,
        stock: 400,
        tags: ['mobile', 'recharge', 'att', 'prepaid'],
        status: 'active' as const,
      },
      {
        supplierId: supplier3.id,
        name: 'T-Mobile Prepaid $15',
        description: 'Instant T-Mobile top-up',
        category: 'mobile_recharge',
        denomination: 15.00,
        price: 15.00,
        discount: 0,
        stock: 450,
        tags: ['mobile', 'recharge', 'tmobile', 'prepaid'],
        status: 'active' as const,
      },
      {
        supplierId: supplier3.id,
        name: 'T-Mobile Prepaid $40',
        description: 'T-Mobile prepaid refill with bonus data',
        category: 'mobile_recharge',
        denomination: 40.00,
        price: 40.00,
        discount: 0,
        stock: 300,
        tags: ['mobile', 'recharge', 'tmobile', 'prepaid'],
        status: 'active' as const,
      },
      {
        supplierId: supplier3.id,
        name: 'Verizon Prepaid $30',
        description: 'Verizon wireless prepaid top-up',
        category: 'mobile_recharge',
        denomination: 30.00,
        price: 30.00,
        discount: 0,
        stock: 350,
        tags: ['mobile', 'recharge', 'verizon', 'prepaid'],
        status: 'active' as const,
      },

      // Gift Cards - Supplier 4
      {
        supplierId: supplier4.id,
        name: 'Amazon Gift Card $25',
        description: 'Shop millions of items on Amazon',
        category: 'gift',
        denomination: 25.00,
        price: 24.50,
        discount: 2.00,
        stock: 300,
        tags: ['shopping', 'amazon', 'gift', 'versatile'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Amazon Gift Card $50',
        description: 'Perfect gift for any occasion',
        category: 'gift',
        denomination: 50.00,
        price: 49.00,
        discount: 2.00,
        stock: 250,
        tags: ['shopping', 'amazon', 'gift', 'popular'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Amazon Gift Card $100',
        description: 'Ultimate shopping freedom',
        category: 'gift',
        denomination: 100.00,
        price: 98.00,
        discount: 2.00,
        stock: 150,
        tags: ['shopping', 'amazon', 'gift', 'premium'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Starbucks Gift Card $10',
        description: 'Enjoy your favorite coffee',
        category: 'gift',
        denomination: 10.00,
        price: 10.00,
        discount: 0,
        stock: 200,
        tags: ['coffee', 'starbucks', 'gift', 'food'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Starbucks Gift Card $25',
        description: 'Perfect for coffee lovers',
        category: 'gift',
        denomination: 25.00,
        price: 25.00,
        discount: 0,
        stock: 180,
        tags: ['coffee', 'starbucks', 'gift', 'food'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'iTunes Gift Card $15',
        description: 'Music, movies, apps and more',
        category: 'gift',
        denomination: 15.00,
        price: 14.50,
        discount: 3.33,
        stock: 160,
        tags: ['apple', 'itunes', 'music', 'apps'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'iTunes Gift Card $25',
        description: 'Apple digital content gift card',
        category: 'gift',
        denomination: 25.00,
        price: 24.25,
        discount: 3.00,
        stock: 140,
        tags: ['apple', 'itunes', 'music', 'apps'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Google Play Gift Card $10',
        description: 'Apps, games, and digital content',
        category: 'gift',
        denomination: 10.00,
        price: 9.80,
        discount: 2.00,
        stock: 220,
        tags: ['google', 'play', 'android', 'apps'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Google Play Gift Card $25',
        description: 'Premium Android content',
        category: 'gift',
        denomination: 25.00,
        price: 24.50,
        discount: 2.00,
        stock: 190,
        tags: ['google', 'play', 'android', 'apps'],
        status: 'active' as const,
      },
      {
        supplierId: supplier4.id,
        name: 'Google Play Gift Card $50',
        description: 'Ultimate Android experience',
        category: 'gift',
        denomination: 50.00,
        price: 49.00,
        discount: 2.00,
        stock: 120,
        tags: ['google', 'play', 'android', 'apps'],
        status: 'active' as const,
      },
    ];

    logger.info('Creating cards and generating codes...');
    let totalCards = 0;
    let totalCodes = 0;

    for (const cardData of cardsData) {
      const card = await Card.create(cardData);
      totalCards++;

      // Generate card codes based on stock (but max 20 per card for seed)
      const codesToGenerate = Math.min(cardData.stock, 20);

      for (let i = 0; i < codesToGenerate; i++) {
        const code = generateCardCode(16);
        const pin = Math.random() > 0.5 ? generateCardCode(4) : null;

        const encryptedCode = encryptCard(code);
        const encryptedPin = pin ? encryptCard(pin) : null;

        await CardCode.create({
          cardId: card.id,
          code: encryptedCode,
          pin: encryptedPin,
          status: 'available',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        });
        totalCodes++;
      }

      if (totalCards % 5 === 0) {
        logger.info(`  ✓ ${totalCards} cards created with codes...`);
      }
    }

    logger.info(`✓ Total: ${totalCards} cards created with ${totalCodes} card codes`);

    // ========== SAMPLE ORDERS ==========
    logger.info('Creating sample orders...');

    // Create some completed orders with card codes
    const sampleCards = await Card.findAll({ limit: 5 });

    for (let i = 0; i < 3; i++) {
      const customer = customers[i];
      const card = sampleCards[i];

      if (!card) continue;

      const quantity = Math.floor(Math.random() * 2) + 1;
      const unitPrice = parseFloat(card.price.toString());
      const totalAmount = unitPrice * quantity;
      const discount = parseFloat(card.discount.toString()) / 100 * totalAmount;
      const finalAmount = totalAmount - discount;

      const order = await Order.create({
        orderNumber: `ORD-${Date.now() + i}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        userId: customer.id,
        cardId: card.id,
        quantity,
        unitPrice,
        totalAmount,
        discount,
        finalAmount,
        currency: 'USD',
        status: 'completed',
        paymentMethod: ['stripe', 'paypal', 'alipay'][i % 3],
        deliveryEmail: customer.email,
        deliveryMethod: 'email',
        paidAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      });

      // Assign card codes to this order
      const codes = await CardCode.findAll({
        where: { cardId: card.id, status: 'available' },
        limit: quantity,
      });

      for (const code of codes) {
        await code.update({
          status: 'sold',
          orderId: order.id,
          soldAt: order.completedAt,
        });
      }

      // Create payment record
      await Payment.create({
        orderId: order.id,
        userId: customer.id,
        amount: finalAmount,
        currency: 'USD',
        method: 'card',
        provider: ['stripe', 'paypal', 'alipay'][i % 3],
        transactionId: `TXN-${Date.now()}-${i}`,
        status: 'completed',
        processedAt: order.paidAt,
      });
    }

    logger.info('✓ 3 sample completed orders created');

    logger.info('');
    logger.info('🎉 Database seeding completed successfully!');
    logger.info('');
    logger.info('📊 Summary:');
    logger.info(`   • Users: ${customers.length + 5} (1 admin, ${customers.length} customers, 4 suppliers)`);
    logger.info(`   • Suppliers: 4`);
    logger.info(`   • Cards: ${totalCards}`);
    logger.info(`   • Card Codes: ${totalCodes}`);
    logger.info(`   • Orders: 3`);
    logger.info('');
    logger.info('🔐 Login credentials:');
    logger.info('   Admin: admin@cardsky.com / admin123');
    logger.info('   Customer: john.doe@test.com / customer123');
    logger.info('   Supplier: supplier1@cardsky.com / supplier123');
    logger.info('');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
