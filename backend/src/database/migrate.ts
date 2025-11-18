import { sequelize } from '../config/database';
import '../models';
import logger from '../utils/logger';

async function migrate() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    await sequelize.sync({ force: false, alter: true });
    logger.info('Database migration completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
