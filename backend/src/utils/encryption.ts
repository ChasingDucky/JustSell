import crypto from 'crypto';
import { config } from '../config';

/**
 * Encrypt card data for secure storage
 */
export const encryptCard = (cardData: string): string => {
  const algorithm = config.encryption.algorithm as crypto.CipherGCFAlgorithm;
  const key = Buffer.from(config.encryption.key, 'utf-8').slice(0, 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cardData, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt card data
 */
export const decryptCard = (encryptedData: string): string => {
  const algorithm = config.encryption.algorithm as crypto.CipherGCFAlgorithm;
  const key = Buffer.from(config.encryption.key, 'utf-8').slice(0, 32);

  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
};

/**
 * Generate random card code
 */
export const generateCardCode = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Mask card code for display (show only last 4 characters)
 */
export const maskCardCode = (cardCode: string): string => {
  if (cardCode.length <= 4) return cardCode;
  return '*'.repeat(cardCode.length - 4) + cardCode.slice(-4);
};
