import geminiClient from '../../config/gemini';
import UserProfile from '../../models/UserProfile';
import userProfileService from '../userProfile.service';

export interface AgentContext {
  userId?: string;
  userProfile?: any;
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: string }>;
  sessionId?: string;
}

export interface AgentResponse {
  message: string;
  data?: any;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
}

export abstract class BaseAIAgent {
  protected name: string;
  protected description: string;
  protected systemPrompt: string;

  constructor(name: string, description: string, systemPrompt: string) {
    this.name = name;
    this.description = description;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Build context-aware prompt
   */
  protected async buildPrompt(
    userMessage: string,
    context: AgentContext
  ): Promise<string> {
    let prompt = `${this.systemPrompt}\n\n`;

    // Add user profile context if available
    if (context.userId) {
      const profile = await userProfileService.getProfile(context.userId);
      if (profile) {
        prompt += `User Profile Context:\n`;
        prompt += `- Top Interests: ${profile.getTopInterests(5).join(', ')}\n`;
        prompt += `- Purchasing Power: ${profile.purchasingPower.level}\n`;
        prompt += `- Average Spend: $${profile.purchasingPower.avgPrice}\n`;
        prompt += `- Total Purchases: ${profile.behaviorMetrics.totalPurchases}\n`;
        prompt += `- Preferred Categories: ${profile.preferredCategories.join(', ')}\n`;

        if (profile.blockedCategories.length > 0) {
          prompt += `- Blocked Categories: ${profile.blockedCategories.join(', ')}\n`;
        }

        prompt += `\n`;
      }
    }

    // Add conversation history
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `Conversation History:\n`;
      context.conversationHistory.forEach((msg, idx) => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts}\n`;
      });
      prompt += `\n`;
    }

    // Add user message
    prompt += `User: ${userMessage}\n\n`;
    prompt += `Assistant:`;

    return prompt;
  }

  /**
   * Generate response using Gemini
   */
  protected async generate(
    prompt: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    if (!geminiClient.isAvailable()) {
      throw new Error('Gemini API is not available. Please configure GEMINI_API_KEY.');
    }

    return await geminiClient.generateContent(prompt, options);
  }

  /**
   * Generate response with chat context
   */
  protected async chat(
    messages: Array<{ role: 'user' | 'model'; parts: string }>,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    if (!geminiClient.isAvailable()) {
      throw new Error('Gemini API is not available. Please configure GEMINI_API_KEY.');
    }

    return await geminiClient.chat(messages, options);
  }

  /**
   * Parse JSON from response
   */
  protected parseJSON<T>(text: string): T | null {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to extract JSON from the text
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      }

      return null;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Abstract method to handle user request
   */
  abstract handle(userMessage: string, context: AgentContext): Promise<AgentResponse>;

  /**
   * Get agent info
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
    };
  }
}
