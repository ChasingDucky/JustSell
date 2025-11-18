import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import aiAssistantService from '../services/ai/aiAssistant.service';

const router = express.Router();

/**
 * @route   GET /api/ai-assistant/agents
 * @desc    Get all available AI agents
 * @access  Public
 */
router.get('/agents', (req, res) => {
  try {
    const agents = aiAssistantService.getAvailableAgents();
    res.json({
      success: true,
      data: agents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-assistant/chat
 * @desc    Chat with AI assistant
 * @access  Private
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId, agentType } = req.body;
    const userId = req.user!.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Use conversationId or create new one based on userId
    const sessionId = conversationId || `conv_${userId}_${Date.now()}`;

    const result = await aiAssistantService.chat(sessionId, message, agentType);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process message',
    });
  }
});

/**
 * @route   GET /api/ai-assistant/conversations/:conversationId
 * @desc    Get conversation history
 * @access  Private
 */
router.get('/conversations/:conversationId', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    const history = aiAssistantService.getHistory(conversationId);

    res.json({
      success: true,
      data: {
        conversationId,
        messages: history,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-assistant/conversations/:conversationId/switch-agent
 * @desc    Switch agent in conversation
 * @access  Private
 */
router.post('/conversations/:conversationId/switch-agent', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    const { agentType } = req.body;

    if (!agentType) {
      return res.status(400).json({
        success: false,
        message: 'Agent type is required',
      });
    }

    aiAssistantService.switchAgent(conversationId, agentType);

    res.json({
      success: true,
      message: 'Agent switched successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/ai-assistant/conversations/:conversationId
 * @desc    Clear conversation history
 * @access  Private
 */
router.delete('/conversations/:conversationId', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    aiAssistantService.clearConversation(conversationId);

    res.json({
      success: true,
      message: 'Conversation cleared successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
