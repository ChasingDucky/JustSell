import { BaseAIAgent, AgentContext, AgentResponse } from './baseAgent.service';
import { Card } from '../../models/Card';
import UserListing from '../../models/UserListing';
import Review from '../../models/review.model';

class ShoppingConsultantAgent extends BaseAIAgent {
  constructor() {
    super(
      'Shopping Consultant Agent',
      'Your personal shopping consultant for questions about products, platform features, orders, and shopping advice.',
      `You are a knowledgeable shopping consultant for JustSell, a comprehensive virtual product marketplace.

Your expertise includes:
1. Product information and comparisons
2. Platform features (payments, shipping, escrow, SubONE membership)
3. Order and delivery questions
4. Shopping tips and best practices
5. Category-specific advice
6. Seller and listing information

Guidelines:
- Provide accurate, helpful information
- Be friendly and conversational
- Offer specific examples when helpful
- Suggest relevant products or features
- Ask follow-up questions to better understand needs
- Explain complex topics in simple terms
- Recommend relevant platform features (like SubONE for subscriptions)

Platform Features to mention when relevant:
- Multiple payment methods (Stripe, PayPal, Alipay, WeChat, Crypto)
- C2C marketplace with escrow protection
- Shipping and logistics (in-house and international)
- SubONE family membership for subscription savings
- Intelligent recommendations based on behavior
- Dispute resolution system
- Physical and virtual product support

Format your response as JSON:
{
  "message": "your detailed response",
  "tips": ["helpful tips related to the question"],
  "relatedTopics": ["related topics they might be interested in"],
  "productSuggestions": [{"name": "", "reason": ""}]
}`
    );
  }

  async handle(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Detect if question is about specific product
      const productInfo = await this.detectProductQuery(userMessage);

      // Build context-aware prompt
      let prompt = await this.buildPrompt(userMessage, context);

      // Add product-specific context if detected
      if (productInfo) {
        prompt += `\n\nProduct Context:\n${JSON.stringify(productInfo, null, 2)}`;
      }

      // Generate response
      const response = await this.generate(prompt, context, context, context, {
        temperature: 0.7,
        maxOutputTokens: 2048,
      });

      // Parse response
      const parsedResponse = this.parseJSON<any>(response);

      if (parsedResponse) {
        const actions = [];

        // Add product view actions if suggestions exist
        if (parsedResponse.productSuggestions) {
          actions.push(...parsedResponse.productSuggestions.map((ps: any) => ({
            type: 'search',
            label: `Search for ${ps.name}`,
            data: { query: ps.name },
          })));
        }

        return {
          message: parsedResponse.message || response,
          data: {
            tips: parsedResponse.tips || [],
            relatedTopics: parsedResponse.relatedTopics || [],
            productSuggestions: parsedResponse.productSuggestions || [],
          },
          suggestions: parsedResponse.relatedTopics?.slice(0, 3) || [],
          actions: actions.length > 0 ? actions : undefined,
        };
      }

      return {
        message: response,
        suggestions: ['Tell me more', 'Show me examples', 'What are the benefits?'],
      };
    } catch (error: any) {
      console.error('Shopping consultant agent error:', error);
      return {
        message: 'I apologize for the inconvenience. Could you please rephrase your question? I\'m here to help!',
        data: { error: error.message },
      };
    }
  }

  private async detectProductQuery(userMessage: string): Promise<any | null> {
    // Simple keyword detection for product queries
    const productKeywords = ['product', 'item', 'card', 'listing', 'buy', 'purchase'];
    const hasProductKeyword = productKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (!hasProductKeyword) {
      return null;
    }

    // Try to extract product name or category
    // This is a simple implementation - could be enhanced with NLP
    return {
      query: userMessage,
      context: 'User asking about products',
    };
  }
}

export default new ShoppingConsultantAgent();
