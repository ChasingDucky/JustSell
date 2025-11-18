import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { decryptApiKey, maskApiKey } from '../utils/encryption';

interface UserAISettingsAttributes {
  id: string;
  userId: string;
  geminiApiKey?: string;
  geminiApiKeyEncrypted?: string; // For security, store encrypted
  enableAI: boolean;
  preferredModel?: 'pro' | 'flash';
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserAISettingsCreationAttributes
  extends Optional<UserAISettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserAISettings
  extends Model<UserAISettingsAttributes, UserAISettingsCreationAttributes>
  implements UserAISettingsAttributes
{
  public id!: string;
  public userId!: string;
  public geminiApiKey?: string;
  public geminiApiKeyEncrypted?: string;
  public enableAI!: boolean;
  public preferredModel?: 'pro' | 'flash';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to check if user has configured API key
  public hasApiKey(): boolean {
    return !!(this.geminiApiKey || this.geminiApiKeyEncrypted);
  }

  // Override toJSON to mask API key
  public toJSON() {
    const values = super.toJSON();

    // Never expose encrypted key
    delete values.geminiApiKeyEncrypted;

    // If plain text key exists, mask it
    if (values.geminiApiKey) {
      values.geminiApiKey = maskApiKey(values.geminiApiKey);
      values.hasApiKey = true;
    } else if (this.geminiApiKeyEncrypted) {
      // Indicate presence without exposing value
      values.geminiApiKey = '********';
      values.hasApiKey = true;
    } else {
      values.hasApiKey = false;
    }

    return values;
  }
}

UserAISettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    geminiApiKey: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User\'s custom Gemini API key (stored in plain text for now)',
    },
    geminiApiKeyEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted version of API key (future enhancement)',
    },
    enableAI: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether AI features are enabled for this user',
    },
    preferredModel: {
      type: DataTypes.ENUM('pro', 'flash'),
      allowNull: true,
      comment: 'User\'s preferred model (if they have choice)',
    },
  },
  {
    sequelize,
    tableName: 'user_ai_settings',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
    ],
  }
);

export default UserAISettings;
