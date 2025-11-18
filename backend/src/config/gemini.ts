import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export enum GeminiModel {
  PRO = 'gemini-1.5-pro', // For premium users (白金会员)
  FLASH = 'gemini-1.5-flash', // For regular users (普通用户)
}

class GeminiClient {
  private defaultConfig: GeminiConfig;
  private systemGenAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.defaultConfig = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: GeminiModel.FLASH, // Default to flash model
      temperature: 0.7,
      maxOutputTokens: 2048,
    };

    if (this.defaultConfig.apiKey) {
      this.systemGenAI = new GoogleGenerativeAI(this.defaultConfig.apiKey);
    } else {
      console.warn('GEMINI_API_KEY is not set. Users must provide their own API keys.');
    }
  }

  /**
   * Get model based on user tier and custom API key
   * @param userApiKey - User's custom Gemini API key (if provided)
   * @param isPremiumUser - Whether user is premium (白金会员)
   */
  private getClient(userApiKey?: string): GoogleGenerativeAI {
    if (userApiKey) {
      // Use user's custom API key
      return new GoogleGenerativeAI(userApiKey);
    }

    if (this.systemGenAI) {
      // Use system API key
      return this.systemGenAI;
    }

    throw new Error('No Gemini API key available. Please configure your API key in settings.');
  }

  /**
   * Get model name based on user tier
   */
  private getModelName(isPremiumUser: boolean): GeminiModel {
    return isPremiumUser ? GeminiModel.PRO : GeminiModel.FLASH;
  }

  /**
   * Get a generative model instance
   */
  getModel(options?: {
    userApiKey?: string;
    isPremiumUser?: boolean;
    temperature?: number;
    maxOutputTokens?: number;
  }): GenerativeModel {
    const client = this.getClient(options?.userApiKey);
    const modelName = this.getModelName(options?.isPremiumUser || false);

    return client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? this.defaultConfig.temperature,
        maxOutputTokens: options?.maxOutputTokens ?? this.defaultConfig.maxOutputTokens,
      },
    });
  }

  /**
   * Generate content from a prompt
   */
  async generateContent(
    prompt: string,
    options?: {
      userApiKey?: string;
      isPremiumUser?: boolean;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    try {
      const model = this.getModel(options);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your API key in settings.');
      }
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Generate content with chat context
   */
  async chat(
    messages: Array<{ role: 'user' | 'model'; parts: string }>,
    options?: {
      userApiKey?: string;
      isPremiumUser?: boolean;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    try {
      const model = this.getModel(options);
      const chat = model.startChat({
        history: messages.slice(0, -1).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.parts);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your API key in settings.');
      }
      throw new Error(`Failed to chat: ${error.message}`);
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: GeminiModel.FLASH });
      await model.generateContent('Hello');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if system API is available
   */
  isSystemApiAvailable(): boolean {
    return !!this.systemGenAI;
  }

  /**
   * Get available models based on user tier
   */
  getAvailableModels(isPremiumUser: boolean): { name: string; description: string }[] {
    const models = [
      {
        name: GeminiModel.FLASH,
        description: 'Gemini 1.5 Flash - Fast and efficient (普通用户)',
      },
    ];

    if (isPremiumUser) {
      models.push({
        name: GeminiModel.PRO,
        description: 'Gemini 1.5 Pro - Most capable model (白金会员专享)',
      });
    }

    return models;
  }
}

export default new GeminiClient();
