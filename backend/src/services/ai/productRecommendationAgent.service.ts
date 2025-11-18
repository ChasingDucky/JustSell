import { BaseAIAgent, AgentContext, AgentResponse } from './baseAgent.service';
import { Card } from '../../models/Card';
import UserListing from '../../models/UserListing';
import { Op } from 'sequelize';

class ProductRecommendationAgent extends BaseAIAgent {
  constructor() {
    super(
      'Product Recommendation Agent',
      'Intelligent product recommendation assistant that helps users find the perfect products based on their needs, preferences, and budget.',
      `You are an expert shopping assistant for JustSell, a virtual product marketplace.

Your role is to:
1. Understand user needs and preferences
2. Recommend the most suitable products from available inventory
3. Consider user's budget, interests, and past purchases
4. Provide detailed explanations for recommendations
5. Offer alternatives and comparisons

Guidelines:
- Be conversational and friendly
- Ask clarifying questions if needed
- Explain why you recommend specific products
- Consider both platform cards and user listings
- Respect user's blocked categories and sellers
- Stay within user's price range when specified
- Provide 3-5 recommendations with reasoning

Format your response as JSON with this structure:
{
  "message": "conversational response",
  "recommendations": [
    {
      "type": "card" or "listing",
      "id": "product_id",
      "name": "product_name",
      "category": "category",
      "price": 0.00,
      "reason": "why you recommend this",
      "rating": 4.5
    }
  ],
  "questions": ["clarifying questions if needed"],
  "summary": "brief summary of recommendations"
}`
    );
  }

  async handle(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Build context-aware prompt
      const prompt = await this.buildPrompt(userMessage, context);

      // Get available products for context
      const products = await this.getAvailableProducts(context);
      const productContext = this.formatProductContext(products);

      // Add product context to prompt
      const fullPrompt = `${prompt}\n\nAvailable Products:\n${productContext}`;

      // Generate recommendation
      const response = await this.generate(fullPrompt, {
        temperature: 0.8,
        maxOutputTokens: 2048,
      });

      // Parse response
      const parsedResponse = this.parseJSON<any>(response);

      if (parsedResponse) {
        return {
          message: parsedResponse.message || response,
          data: {
            recommendations: parsedResponse.recommendations || [],
            summary: parsedResponse.summary,
          },
          suggestions: parsedResponse.questions || [],
          actions: parsedResponse.recommendations?.map((rec: any, idx: number) => ({
            type: 'view_product',
            label: `View ${rec.name}`,
            data: {
              type: rec.type,
              id: rec.id,
            },
          })) || [],
        };
      }

      return {
        message: response,
        suggestions: ['Can you tell me more about your budget?', 'What categories interest you?'],
      };
    } catch (error: any) {
      console.error('Product recommendation agent error:', error);
      return {
        message: 'I apologize, but I encountered an error while processing your request. Please try again.',
        data: { error: error.message },
      };
    }
  }

  private async getAvailableProducts(context: AgentContext): Promise<any[]> {
    const products: any[] = [];

    // Get top cards
    const cards = await Card.findAll({
      where: {
        status: 'active',
        stock: { [Op.gt]: 0 },
      },
      limit: 20,
      order: [['rating', 'DESC'], ['reviewCount', 'DESC']],
    });

    products.push(...cards.map(card => ({
      type: 'card',
      id: card.id,
      name: card.name,
      category: card.category,
      price: Number(card.price),
      rating: Number(card.rating),
      reviewCount: card.reviewCount,
      description: card.description,
    })));

    // Get top listings
    const listings = await UserListing.findAll({
      where: {
        status: 'active',
        stock: { [Op.gt]: 0 },
      },
      limit: 20,
      order: [['rating', 'DESC'], ['soldCount', 'DESC']],
    });

    products.push(...listings.map(listing => ({
      type: 'listing',
      id: listing.id,
      name: listing.title,
      category: listing.category,
      price: Number(listing.price),
      rating: Number(listing.rating),
      reviewCount: listing.totalReviews,
      description: listing.description,
    })));

    return products;
  }

  private formatProductContext(products: any[]): string {
    return products
      .slice(0, 30) // Limit context size
      .map(
        (p, idx) =>
          `${idx + 1}. [${p.type.toUpperCase()}] ${p.name} - ${p.category} - $${p.price} - Rating: ${p.rating}/5 (${p.reviewCount} reviews)`
      )
      .join('\n');
  }
}

export default new ProductRecommendationAgent();
