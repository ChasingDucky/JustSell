# AI Shopping Assistants - Setup Guide

## Overview

JustSell now includes 5 intelligent shopping assistants powered by Google's Gemini 1.5 Pro API:

1. **Product Recommendation Agent** - Intelligent product recommendations based on user needs
2. **Shopping Consultant Agent** - Answers questions about products, platform, and shopping
3. **Budget Planner Agent** - Helps optimize spending and find savings
4. **Price Comparison Agent** - Compares prices and finds best value
5. **Review Analysis Agent** - Analyzes product reviews and provides insights

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install @google/generative-ai
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure Environment Variables

Add to your `backend/.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Endpoints

### Get Available Agents
```http
GET /api/ai-assistant/agents
```

### Start Conversation
```http
POST /api/ai-assistant/conversation/start
Body: { "sessionId": "optional_session_id" }
```

### Chat with AI
```http
POST /api/ai-assistant/chat
Body: {
  "conversationId": "conv_userId_timestamp",
  "message": "I need help finding a gift card",
  "agentType": "product_recommendation" // optional
}
```

### Get Conversation History
```http
GET /api/ai-assistant/conversation/:conversationId/history
```

### Switch Agent
```http
POST /api/ai-assistant/conversation/:conversationId/switch-agent
Body: { "agentType": "budget_planner" }
```

### Quick Query (No Context)
```http
POST /api/ai-assistant/quick-query
Body: {
  "message": "What are the benefits of SubONE membership?",
  "agentType": "shopping_consultant"
}
```

## Agent Types

- `product_recommendation` - Product recommendations
- `shopping_consultant` - General shopping questions
- `budget_planner` - Budget and spending optimization
- `price_comparison` - Price comparison and value analysis
- `review_analysis` - Review sentiment and insights

## Features

### Automatic Agent Detection

The system automatically detects which agent should handle your query based on keywords:

- **Budget keywords**: "budget", "save money", "spending", "subscription"
- **Price keywords**: "compare", "cheaper", "best deal"
- **Review keywords**: "review", "rating", "is it good"
- **Recommendation keywords**: "recommend", "suggest", "looking for"

### Context-Aware Responses

All agents consider:
- User profile and interests
- Purchase history
- Preferred categories
- Blocked categories/sellers
- Price range preferences
- Conversation history

### Structured Responses

Agents return JSON responses with:
- Conversational message
- Structured data
- Action suggestions
- Quick reply options

## Example Usage

### Product Recommendation

```json
{
  "message": "I'm looking for gaming gift cards under $50",
  "agentType": "product_recommendation"
}
```

Response:
```json
{
  "message": "I'd be happy to help you find gaming gift cards...",
  "recommendations": [
    {
      "type": "card",
      "id": "...",
      "name": "Steam Gift Card $25",
      "price": 25.00,
      "reason": "Perfect for PC gaming..."
    }
  ]
}
```

### Budget Planning

```json
{
  "message": "Help me save money on my subscriptions",
  "agentType": "budget_planner"
}
```

Response:
```json
{
  "message": "I can help you optimize your subscription costs...",
  "currentSpending": { "monthly": 150, "annual": 1800 },
  "savingsOpportunities": [
    {
      "type": "subone_membership",
      "potentialSavings": "20-40%",
      "action": "Subscribe to SubONE Premium"
    }
  ]
}
```

### Price Comparison

```json
{
  "message": "Compare Netflix gift cards",
  "agentType": "price_comparison"
}
```

Response:
```json
{
  "message": "I found 5 Netflix gift card options...",
  "comparison": [...],
  "bestValue": {
    "id": "...",
    "name": "Netflix $50 Gift Card",
    "reason": "Best price per dollar with highest ratings"
  }
}
```

## Frontend Integration

```typescript
import api from './services/api';

// Get available agents
const agents = await api.getAIAgents();

// Start conversation
const { conversationId } = await api.startAIConversation();

// Chat with AI
const response = await api.chatWithAI({
  conversationId,
  message: "I need help finding a gift",
  agentType: "product_recommendation"
});

// Quick query (no context)
const quickResponse = await api.quickAIQuery(
  "What is SubONE membership?"
);
```

## Best Practices

1. **Use Specific Queries**: More specific questions get better responses
2. **Provide Context**: Mention budget, preferences, use case
3. **Follow Suggestions**: Agents provide helpful follow-up questions
4. **Try Different Agents**: Each agent specializes in different tasks
5. **Keep Conversations Focused**: Switch agents when changing topics

## Limitations

- Requires active Gemini API key
- Rate limits apply based on your Gemini API tier
- Response time depends on API latency
- Conversation history limited to last 20 messages
- Recommendations based on available inventory

## Troubleshooting

### "Gemini API is not available"
- Check if `GEMINI_API_KEY` is set in `.env`
- Verify API key is valid
- Ensure `@google/generative-ai` is installed

### Slow Responses
- Gemini API may have latency
- Consider implementing caching for common queries
- Use quick-query for simple questions

### Inaccurate Recommendations
- Ensure user profile is complete
- Check if products are properly indexed
- Verify category mappings

## Future Enhancements

- [ ] Conversation persistence (database)
- [ ] Multi-language support
- [ ] Voice interaction
- [ ] Product image analysis
- [ ] Comparison charts and visualizations
- [ ] Proactive suggestions
- [ ] A/B testing different prompts
- [ ] Analytics dashboard
