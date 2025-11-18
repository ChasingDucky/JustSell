import { BaseAIAgent, AgentContext, AgentResponse } from './baseAgent.service';
import productRecommendationAgent from './productRecommendationAgent.service';
import shoppingConsultantAgent from './shoppingConsultantAgent.service';
import budgetPlannerAgent from './budgetPlannerAgent.service';
import priceComparisonAgent from './priceComparisonAgent.service';
import reviewAnalysisAgent from './reviewAnalysisAgent.service';

export enum AgentType {
  PRODUCT_RECOMMENDATION = 'product_recommendation',
  SHOPPING_CONSULTANT = 'shopping_consultant',
  BUDGET_PLANNER = 'budget_planner',
  PRICE_COMPARISON = 'price_comparison',
  REVIEW_ANALYSIS = 'review_analysis',
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
}

interface Conversation {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  currentAgent?: AgentType;
  createdAt: Date;
  updatedAt: Date;
}

class AIAssistantService {
  private agents: Map<AgentType, BaseAIAgent>;
  private conversations: Map<string, Conversation>;

  constructor() {
    // Initialize agents
    this.agents = new Map([
      [AgentType.PRODUCT_RECOMMENDATION, productRecommendationAgent],
      [AgentType.SHOPPING_CONSULTANT, shoppingConsultantAgent],
      [AgentType.BUDGET_PLANNER, budgetPlannerAgent],
      [AgentType.PRICE_COMPARISON, priceComparisonAgent],
      [AgentType.REVIEW_ANALYSIS, reviewAnalysisAgent],
    ]);

    // Initialize conversation storage (in production, this would be a database)
    this.conversations = new Map();
  }

  /**
   * Get all available agents
   */
  getAvailableAgents(): Array<{ type: AgentType; name: string; description: string }> {
    return Array.from(this.agents.entries()).map(([type, agent]) => ({
      type,
      ...agent.getInfo(),
    }));
  }

  /**
   * Detect which agent should handle the request
   */
  detectAgent(userMessage: string): AgentType {
    const message = userMessage.toLowerCase();

    // Budget and savings keywords
    if (
      message.includes('budget') ||
      message.includes('save money') ||
      message.includes('spending') ||
      message.includes('cost') ||
      message.includes('subscription') ||
      message.includes('subone')
    ) {
      return AgentType.BUDGET_PLANNER;
    }

    // Price comparison keywords
    if (
      message.includes('compare') ||
      message.includes('price') ||
      message.includes('cheaper') ||
      message.includes('best deal') ||
      message.includes('which is better')
    ) {
      return AgentType.PRICE_COMPARISON;
    }

    // Review analysis keywords
    if (
      message.includes('review') ||
      message.includes('rating') ||
      message.includes('feedback') ||
      message.includes('what do people say') ||
      message.includes('is it good')
    ) {
      return AgentType.REVIEW_ANALYSIS;
    }

    // Product recommendation keywords
    if (
      message.includes('recommend') ||
      message.includes('suggest') ||
      message.includes('looking for') ||
      message.includes('need') ||
      message.includes('want to buy')
    ) {
      return AgentType.PRODUCT_RECOMMENDATION;
    }

    // Default to shopping consultant for general questions
    return AgentType.SHOPPING_CONSULTANT;
  }

  /**
   * Start a new conversation
   */
  startConversation(userId: string, sessionId?: string): string {
    const conversationId = sessionId || `conv_${userId}_${Date.now()}`;

    this.conversations.set(conversationId, {
      id: conversationId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return conversationId;
  }

  /**
   * Get conversation
   */
  getConversation(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Chat with AI assistant
   */
  async chat(
    conversationId: string,
    userMessage: string,
    agentType?: AgentType
  ): Promise<{
    response: AgentResponse;
    agentType: AgentType;
    conversationId: string;
  }> {
    let conversation = this.getConversation(conversationId);

    if (!conversation) {
      // Extract userId from conversationId (format: conv_userId_timestamp)
      const userId = conversationId.split('_')[1];
      conversationId = this.startConversation(userId, conversationId);
      conversation = this.getConversation(conversationId)!;
    }

    // Detect agent if not specified
    const selectedAgentType = agentType || conversation.currentAgent || this.detectAgent(userMessage);
    const agent = this.agents.get(selectedAgentType);

    if (!agent) {
      throw new Error(`Agent type ${selectedAgentType} not found`);
    }

    // Get user's API configuration
    const aiSettingsService = (await import('../aiSettings.service')).default;
    const apiConfig = await aiSettingsService.getApiConfig(conversation.userId);

    // Build context from conversation history
    const context: AgentContext = {
      userId: conversation.userId,
      sessionId: conversationId,
      conversationHistory: conversation.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: msg.content,
      })),
      userApiKey: apiConfig.userApiKey,
      isPremiumUser: apiConfig.isPremiumUser,
    };

    // Get response from agent
    const response = await agent.handle(userMessage, context);

    // Update conversation
    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    conversation.messages.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      agentType: selectedAgentType,
    });

    conversation.currentAgent = selectedAgentType;
    conversation.updatedAt = new Date();

    // Keep only last 20 messages to manage memory
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    return {
      response,
      agentType: selectedAgentType,
      conversationId,
    };
  }

  /**
   * Switch agent in conversation
   */
  switchAgent(conversationId: string, agentType: AgentType): void {
    const conversation = this.getConversation(conversationId);
    if (conversation) {
      conversation.currentAgent = agentType;
    }
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string): ConversationMessage[] {
    const conversation = this.getConversation(conversationId);
    return conversation ? conversation.messages : [];
  }
}

export default new AIAssistantService();
