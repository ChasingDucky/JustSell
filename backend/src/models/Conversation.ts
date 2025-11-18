import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ConversationAttributes {
  id: string;
  userId: string;
  agentType: string;
  title?: string;
  summary?: string;
  messageCount: number;
  lastMessageAt: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes
  extends Optional<ConversationAttributes, 'id' | 'title' | 'summary' | 'metadata' | 'messageCount' | 'lastMessageAt' | 'createdAt' | 'updatedAt'> {}

class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  public id!: string;
  public userId!: string;
  public agentType!: string;
  public title?: string;
  public summary?: string;
  public messageCount!: number;
  public lastMessageAt!: Date;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    agentType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of AI agent (product_recommendation, shopping_consultant, etc.)',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Conversation title (auto-generated from first message)',
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Summary of conversation (for context compression)',
    },
    messageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata (agent switches, ratings, etc.)',
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'lastMessageAt'] },
      { fields: ['agentType'] },
    ],
  }
);

export default Conversation;
