import { BaseAIAgent, AgentContext, AgentResponse } from './baseAgent.service';
import { Card } from '../../models/Card';
import UserListing from '../../models/UserListing';
import { Op } from 'sequelize';

class PriceComparisonAgent extends BaseAIAgent {
  constructor() {
    super(
      'Price Comparison Agent',
      'Expert at comparing prices, finding best deals, and evaluating value for money across products.',
      `You are a price comparison expert for JustSell marketplace.

Your capabilities:
1. Compare prices across similar products
2. Identify best value propositions
3. Consider quality vs price tradeoffs
4. Highlight special deals and discounts
5. Factor in ratings and reviews
6. Consider shipping costs for physical products
7. Recommend timing for purchases (if deals are cyclical)

Analysis factors:
- Base price
- Discount percentage
- Quality indicators (rating, reviews)
- Seller reputation
- Shipping costs (for physical products)
- Value per unit or feature
- Long-term costs (for subscriptions)

Guidelines:
- Be objective and data-driven
- Show clear price comparisons
- Explain value beyond just price
- Highlight hidden costs
- Recommend best overall value, not just cheapest
- Consider user's quality preferences
- Mention any money-back guarantees or warranties

Format response as JSON:
{
  "message": "comparison summary and recommendation",
  "comparison": [
    {
      "productName": "",
      "type": "card or listing",
      "id": "",
      "price": 0.00,
      "originalPrice": 0.00,
      "discount": "0%",
      "rating": 4.5,
      "reviews": 100,
      "valueScore": 8.5,
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1"],
      "shippingCost": 0.00
    }
  ],
  "bestValue": {
    "id": "",
    "name": "",
    "reason": "why it's the best value"
  },
  "cheapest": {
    "id": "",
    "name": "",
    "reason": "if user wants the cheapest option"
  },
  "recommendation": "overall recommendation with reasoning"
}`
    );
  }

  async handle(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract product comparison query
      const products = await this.findProductsForComparison(userMessage);

      // Build context-aware prompt
      let prompt = await this.buildPrompt(userMessage, context);

      // Add product data for comparison
      if (products.length > 0) {
        prompt += `\n\nProducts to Compare:\n${JSON.stringify(products, null, 2)}`;
      }

      // Generate comparison
      const response = await this.generate(prompt, {
        temperature: 0.5, // Lower temperature for factual comparison
        maxOutputTokens: 2048,
      });

      // Parse response
      const parsedResponse = this.parseJSON<any>(response);

      if (parsedResponse) {
        const actions = [];

        // Add view actions for compared products
        if (parsedResponse.comparison) {
          actions.push(...parsedResponse.comparison.slice(0, 3).map((item: any) => ({
            type: 'view_product',
            label: `View ${item.productName}`,
            data: {
              type: item.type,
              id: item.id,
            },
          })));
        }

        return {
          message: parsedResponse.message || response,
          data: {
            comparison: parsedResponse.comparison || [],
            bestValue: parsedResponse.bestValue,
            cheapest: parsedResponse.cheapest,
            recommendation: parsedResponse.recommendation,
          },
          suggestions: [
            'Show me the best value option',
            'Compare with similar products',
            'Tell me about deals',
          ],
          actions: actions.length > 0 ? actions : undefined,
        };
      }

      return {
        message: response,
        suggestions: ['Compare products', 'Find best deals', 'Check price history'],
      };
    } catch (error: any) {
      console.error('Price comparison agent error:', error);
      return {
        message: 'I\'m having trouble comparing prices at the moment. Could you specify which products you\'d like me to compare?',
        data: { error: error.message },
      };
    }
  }

  private async findProductsForComparison(query: string): Promise<any[]> {
    // Extract category or product type from query
    // This is a simple implementation - could be enhanced with NLP
    const products: any[] = [];

    try {
      // Search cards
      const cards = await Card.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } },
            { category: { [Op.iLike]: `%${query}%` } },
          ],
        },
        limit: 10,
        order: [['rating', 'DESC']],
      });

      products.push(...cards.map(card => ({
        type: 'card',
        id: card.id,
        name: card.name,
        category: card.category,
        price: Number(card.price),
        originalPrice: card.denomination ? Number(card.denomination) : Number(card.price),
        discount: card.discount ? Number(card.discount) : 0,
        rating: Number(card.rating),
        reviewCount: card.reviewCount,
        description: card.description,
      })));

      // Search listings
      const listings = await UserListing.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { category: { [Op.iLike]: `%${query}%` } },
          ],
        },
        limit: 10,
        order: [['rating', 'DESC']],
      });

      products.push(...listings.map(listing => ({
        type: 'listing',
        id: listing.id,
        name: listing.title,
        category: listing.category,
        price: Number(listing.price),
        originalPrice: listing.originalPrice ? Number(listing.originalPrice) : Number(listing.price),
        discount: listing.discountPercent ? Number(listing.discountPercent) : 0,
        rating: Number(listing.rating),
        reviewCount: listing.totalReviews,
        description: listing.description,
      })));

      return products;
    } catch (error) {
      console.error('Error finding products:', error);
      return [];
    }
  }
}

export default new PriceComparisonAgent();
