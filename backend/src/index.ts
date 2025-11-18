import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import configurations and middleware
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Import database
import { sequelize } from './config/database';
import { redisClient } from './config/redis';

// Import routes
import authRoutes from './routes/auth.routes';
import cardRoutes from './routes/card.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import supplierRoutes from './routes/supplier.routes';
import paymentRoutes from './routes/payment.routes';
import enhancedPaymentRoutes from './routes/payment.routes.enhanced';
import analyticsRoutes from './routes/analytics.routes';
import searchRoutes from './routes/search.routes';
import inventoryRoutes from './routes/inventory.routes';
import recommendationRoutes from './routes/recommendation.routes';
import reviewRoutes from './routes/review.routes';
import sellerRoutes from './routes/seller.routes';
import listingRoutes from './routes/listing.routes';
import escrowRoutes from './routes/escrow.routes';
import disputeRoutes from './routes/dispute.routes';
import subscriptionRoutes from './routes/subscription.routes';
import suboneRoutes from './routes/subone.routes';
import shippingRoutes from './routes/shipping.routes';
import addressRoutes from './routes/address.routes';
import profileRoutes from './routes/profile.routes';
import smartRecommendationRoutes from './routes/smartRecommendation.routes';
import aiAssistantRoutes from './routes/aiAssistant.routes';

// Import API documentation
import { setupSwagger } from './config/swagger';

class App {
  public app: Application;
  public server: any;
  public io: Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.corsOrigin,
        credentials: true
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
    this.initializeSocketIO();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true
    }));

    // Body parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
      }));
    }

    // Rate limiting
    this.app.use('/api', rateLimiter);

    // API Documentation
    setupSwagger(this.app);
  }

  private initializeRoutes(): void {
    const apiPrefix = config.apiPrefix;

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/cards`, cardRoutes);
    this.app.use(`${apiPrefix}/orders`, orderRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/suppliers`, supplierRoutes);
    this.app.use(`${apiPrefix}/payments`, enhancedPaymentRoutes); // Enhanced multi-payment support
    this.app.use(`${apiPrefix}/analytics`, analyticsRoutes);
    this.app.use(`${apiPrefix}/search`, searchRoutes);
    this.app.use(`${apiPrefix}/inventory`, inventoryRoutes);
    this.app.use(`${apiPrefix}/recommendations`, recommendationRoutes);
    this.app.use(`${apiPrefix}/reviews`, reviewRoutes);
    this.app.use(`${apiPrefix}/sellers`, sellerRoutes); // C2C seller management
    this.app.use(`${apiPrefix}/listings`, listingRoutes); // C2C user listings
    this.app.use(`${apiPrefix}/escrow`, escrowRoutes); // Escrow transactions
    this.app.use(`${apiPrefix}/disputes`, disputeRoutes); // Dispute resolution
    this.app.use(`${apiPrefix}/subscriptions`, subscriptionRoutes); // Subscription tracking
    this.app.use(`${apiPrefix}/subone`, suboneRoutes); // SubONE family membership
    this.app.use(`${apiPrefix}/shipping`, shippingRoutes); // Shipping and logistics
    this.app.use(`${apiPrefix}/addresses`, addressRoutes); // Shipping addresses
    this.app.use(`${apiPrefix}/profile`, profileRoutes); // User profile and preferences
    this.app.use(`${apiPrefix}/smart-recommendations`, smartRecommendationRoutes); // Smart recommendations and behavior tracking
    this.app.use(`${apiPrefix}/ai-assistant`, aiAssistantRoutes); // AI shopping assistants powered by Gemini
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully');

      if (config.nodeEnv === 'development') {
        await sequelize.sync({ alter: true });
        logger.info('Database synchronized');
      }

      await redisClient.connect();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Unable to connect to database:', error);
      process.exit(1);
    }
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Real-time inventory updates
      socket.on('subscribe:inventory', (cardId: string) => {
        socket.join(`inventory:${cardId}`);
      });

      socket.on('unsubscribe:inventory', (cardId: string) => {
        socket.leave(`inventory:${cardId}`);
      });
    });

    // Make io accessible to other modules
    this.app.set('io', this.io);
  }

  public listen(): void {
    this.server.listen(config.port, () => {
      logger.info(`🚀 Server is running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
    });
  }

  public async close(): Promise<void> {
    await sequelize.close();
    await redisClient.quit();
    this.server.close();
  }
}

// Create and start server
const application = new App();
application.listen();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await application.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await application.close();
  process.exit(0);
});

export default application;
