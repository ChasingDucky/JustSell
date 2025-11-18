import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import aiAssistantService, { AgentType } from '../services/ai/aiAssistant.service';

const router = Router();

// Get available AI agents
router.get('/agents', optionalAuth, async (req: Request, res: Response) => {
  try {
    const agents = aiAssistantService.getAvailableAgents();

    res.json({
      success: true,
      data: agents,
    });
  } catch (error: any) {
    console.error('Error getting agents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get agents',
    });
  }
});

// Start a new conversation
router.post('/conversation/start', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sessionId } = req.body;

    const conversationId = aiAssistantService.startConversation(userId, sessionId);

    res.json({
      success: true,
      data: { conversationId },
      message: 'Conversation started',
    });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start conversation',
    });
  }
});

// Chat with AI assistant
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId, message, agentType } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Use or create conversationId
    const convId = conversationId || `conv_${userId}_${Date.now()}`;

    // Validate agent type if provided
    if (agentType && !Object.values(AgentType).includes(agentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent type',
      });
    }

    const result = await aiAssistantService.chat(convId, message, agentType);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat',
    });
  }
});

// Get conversation history
router.get('/conversation/:conversationId/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId } = req.params;

    // Verify conversation belongs to user
    if (!conversationId.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const history = aiAssistantService.getHistory(conversationId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get conversation history',
    });
  }
});

// Switch agent in conversation
router.post('/conversation/:conversationId/switch-agent', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { agentType } = req.body;

    // Verify conversation belongs to user
    if (!conversationId.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Validate agent type
    if (!Object.values(AgentType).includes(agentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent type',
      });
    }

    aiAssistantService.switchAgent(conversationId, agentType);

    res.json({
      success: true,
      message: 'Agent switched successfully',
      data: { agentType },
    });
  } catch (error: any) {
    console.error('Error switching agent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to switch agent',
    });
  }
});

// Clear conversation
router.delete('/conversation/:conversationId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId } = req.params;

    // Verify conversation belongs to user
    if (!conversationId.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    aiAssistantService.clearConversation(conversationId);

    res.json({
      success: true,
      message: 'Conversation cleared',
    });
  } catch (error: any) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear conversation',
    });
  }
});

// Quick query (no conversation context)
router.post('/quick-query', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { message, agentType } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Create temporary conversation
    const tempConvId = `temp_${userId}_${Date.now()}`;
    const result = await aiAssistantService.chat(tempConvId, message, agentType);

    // Clean up temporary conversation
    aiAssistantService.clearConversation(tempConvId);

    res.json({
      success: true,
      data: result.response,
    });
  } catch (error: any) {
    console.error('Error in quick query:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process query',
    });
  }
});

export default router;
