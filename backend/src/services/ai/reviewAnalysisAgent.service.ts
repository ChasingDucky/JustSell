import { BaseAIAgent, AgentContext, AgentResponse } from './baseAgent.service';
import Review from '../../models/review.model';
import { Card } from '../../models/Card';
import UserListing from '../../models/UserListing';

class ReviewAnalysisAgent extends BaseAIAgent {
  constructor() {
    super(
      'Review Analysis Agent',
      'Analyzes product reviews to provide insights, sentiment analysis, and purchase recommendations based on customer feedback.',
      `You are an expert review analyst for JustSell marketplace.

Your capabilities:
1. Analyze customer reviews for sentiment and key themes
2. Identify common praise and complaints
3. Detect potential issues or red flags
4. Summarize overall customer satisfaction
5. Highlight specific use cases from reviews
6. Compare review patterns across products
7. Provide purchase recommendations based on reviews

Analysis approach:
- Look for recurring themes in reviews
- Identify verified vs unverified purchases
- Consider review recency
- Detect extreme opinions (very positive/negative)
- Note specific features mentioned
- Assess review authenticity signals
- Consider rating distribution

Guidelines:
- Be balanced and objective
- Highlight both positives and negatives
- Quote specific reviews when relevant
- Identify review patterns
- Warn about potential issues
- Consider user's specific needs
- Recommend based on review insights

Format response as JSON:
{
  "message": "comprehensive review analysis",
  "overallSentiment": "positive | mixed | negative",
  "sentimentScore": 0-10,
  "keyFindings": {
    "commonPraises": ["praise 1", "praise 2"],
    "commonComplaints": ["complaint 1", "complaint 2"],
    "redFlags": ["issue 1"],
    "standoutFeatures": ["feature 1"]
  },
  "ratingBreakdown": {
    "5star": 0,
    "4star": 0,
    "3star": 0,
    "2star": 0,
    "1star": 0
  },
  "topReviews": [
    {
      "rating": 5,
      "excerpt": "review excerpt",
      "helpful": true,
      "verified": true
    }
  ],
  "recommendation": {
    "shouldBuy": true,
    "confidence": "high | medium | low",
    "reason": "explanation based on reviews",
    "bestFor": "who this product is best for",
    "notFor": "who should avoid this"
  }
}`
    );
  }

  async handle(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract product information from query
      const productInfo = await this.extractProductInfo(userMessage);

      // Get reviews for the product
      const reviews = productInfo ? await this.getProductReviews(productInfo) : null;

      // Build context-aware prompt
      let prompt = await this.buildPrompt(userMessage, context);

      // Add review data
      if (reviews && reviews.length > 0) {
        const reviewData = this.formatReviewData(reviews);
        prompt += `\n\nReview Data:\n${reviewData}`;
      }

      // Generate analysis
      const response = await this.generate(prompt, {
        temperature: 0.6,
        maxOutputTokens: 2048,
      });

      // Parse response
      const parsedResponse = this.parseJSON<any>(response);

      if (parsedResponse) {
        const actions = [];

        // Add view product action if recommended
        if (parsedResponse.recommendation?.shouldBuy && productInfo) {
          actions.push({
            type: 'view_product',
            label: 'View Product',
            data: {
              type: productInfo.type,
              id: productInfo.id,
            },
          });
        }

        return {
          message: parsedResponse.message || response,
          data: {
            overallSentiment: parsedResponse.overallSentiment,
            sentimentScore: parsedResponse.sentimentScore,
            keyFindings: parsedResponse.keyFindings,
            ratingBreakdown: parsedResponse.ratingBreakdown,
            topReviews: parsedResponse.topReviews || [],
            recommendation: parsedResponse.recommendation,
          },
          suggestions: [
            'Show me negative reviews',
            'What do verified buyers say?',
            'Compare with similar products',
          ],
          actions: actions.length > 0 ? actions : undefined,
        };
      }

      return {
        message: response,
        suggestions: ['Analyze reviews', 'Show pros and cons', 'Is it worth buying?'],
      };
    } catch (error: any) {
      console.error('Review analysis agent error:', error);
      return {
        message: 'I\'m having trouble analyzing reviews right now. Could you specify which product you\'d like me to analyze?',
        data: { error: error.message },
      };
    }
  }

  private async extractProductInfo(query: string): Promise<{ type: 'card' | 'listing'; id: string } | null> {
    // This is a simple implementation - would need enhancement for production
    // For now, return null and let the agent handle general review analysis
    return null;
  }

  private async getProductReviews(productInfo: { type: 'card' | 'listing'; id: string }): Promise<Review[]> {
    try {
      if (productInfo.type === 'card') {
        return await Review.findAll({
          where: { cardId: productInfo.id },
          order: [['createdAt', 'DESC']],
          limit: 50,
        });
      }
      return [];
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  private formatReviewData(reviews: Review[]): string {
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(review => {
      const rating = Number(review.rating);
      ratingCounts[rating as keyof typeof ratingCounts]++;
    });

    let data = `Total Reviews: ${reviews.length}\n`;
    data += `Rating Distribution:\n`;
    data += `5 stars: ${ratingCounts[5]}\n`;
    data += `4 stars: ${ratingCounts[4]}\n`;
    data += `3 stars: ${ratingCounts[3]}\n`;
    data += `2 stars: ${ratingCounts[2]}\n`;
    data += `1 star: ${ratingCounts[1]}\n\n`;

    data += `Recent Reviews:\n`;
    reviews.slice(0, 10).forEach((review, idx) => {
      data += `${idx + 1}. Rating: ${review.rating}/5\n`;
      data += `   Comment: ${review.comment}\n`;
      if (review.pros) data += `   Pros: ${review.pros}\n`;
      if (review.cons) data += `   Cons: ${review.cons}\n`;
      data += `\n`;
    });

    return data;
  }
}

export default new ReviewAnalysisAgent();
