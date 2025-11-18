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

/**
 * Encrypt API key using AES-256-GCM with authentication
 */
export const encryptApiKey = (apiKey: string): string => {
  if (!apiKey) {
    throw new Error('API key cannot be empty');
  }

  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(config.encryption.key, 'utf-8').slice(0, 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Return format: iv:encrypted:tag
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
};

/**
 * Decrypt API key
 */
export const decryptApiKey = (encryptedKey: string): string => {
  if (!encryptedKey) {
    throw new Error('Encrypted key cannot be empty');
  }

  try {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(config.encryption.key, 'utf-8').slice(0, 32);
    const parts = encryptedKey.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted key format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt API key: ' + (error as Error).message);
  }
};

/**
 * Mask API key for display (show prefix and last 4 chars)
 */
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length <= 8) {
    return '********';
  }

  const prefix = apiKey.substring(0, 7); // e.g., "sk-proj"
  const lastFour = apiKey.substring(apiKey.length - 4);

  return `${prefix}${'*'.repeat(20)}${lastFour}`;
};
