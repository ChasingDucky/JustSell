import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageAttributes {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes
  extends Optional<MessageAttributes, 'id' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: string;
  public conversationId!: string;
  public role!: 'user' | 'assistant' | 'system';
  public content!: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant', 'system'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data (tokens used, model, actions suggested, etc.)',
    },
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['conversationId', 'createdAt'] },
    ],
  }
);

export default Message;
