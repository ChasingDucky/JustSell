import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private config: GeminiConfig;

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-pro', // Using Gemini 1.5 Pro (latest available)
      temperature: 0.7,
      maxOutputTokens: 2048,
    };

    if (!this.config.apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI features will be disabled.');
    }

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
  }

  /**
   * Get a generative model instance
   */
  getModel(options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: options?.temperature ?? this.config.temperature,
        maxOutputTokens: options?.maxOutputTokens ?? this.config.maxOutputTokens,
      },
    });
  }

  /**
   * Generate content from a prompt
   */
  async generateContent(prompt: string, options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<string> {
    try {
      const model = this.getModel(options);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Generate content with chat context
   */
  async chat(messages: Array<{ role: 'user' | 'model'; parts: string }>, options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<string> {
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
      throw new Error(`Failed to chat: ${error.message}`);
    }
  }

  /**
   * Check if API is available
   */
  isAvailable(): boolean {
    return !!this.config.apiKey;
  }
}

export default new GeminiClient();
