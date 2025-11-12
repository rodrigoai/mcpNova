#!/usr/bin/env node

import express, { Request, Response } from 'express';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChatbotService, ChatRequest } from './services/chatbotService.js';

// Load environment variables
config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.CHATBOT_PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.resolve(__dirname, '../public')));

// Initialize chatbot service
const mcpServerPath = path.resolve(__dirname, 'index.js');
const chatbotService = new ChatbotService(mcpServerPath);

// Initialize MCP client on startup
chatbotService.initialize()
  .then(() => {
    console.log('[Chatbot Server] MCP client initialized');
  })
  .catch((error) => {
    console.error('[Chatbot Server] Failed to initialize MCP client:', error);
  });

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body as ChatRequest;

    // Validate request
    if (!message || typeof message !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        details: 'Message field is required and must be a string',
      });
      return;
    }

    // Process chat request
    const response = await chatbotService.chat({ message, context });

    res.json(response);
  } catch (error) {
    console.error('[Chatbot Server] Error processing chat request:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Reset conversation endpoint
app.post('/api/chat/reset', (req: Request, res: Response) => {
  try {
    chatbotService.resetConversation();
    res.json({ status: 'success', message: 'Conversation reset' });
  } catch (error) {
    console.error('[Chatbot Server] Error resetting conversation:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[Chatbot Server] Shutting down gracefully...');
  
  await chatbotService.shutdown();
  
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('[Chatbot Server] Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Chatbot Server] Listening on port ${PORT}`);
  console.log(`[Chatbot Server] Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`[Chatbot Server] Health check: GET http://localhost:${PORT}/health`);
  console.log(`[Chatbot Server] Reset conversation: POST http://localhost:${PORT}/api/chat/reset`);
  
  const agentTone = process.env.AGENT_TONE || process.env.AGENT_STYLE || 'Professional, helpful, and efficient';
  console.log(`[Chatbot Server] Agent tone: ${agentTone}`);
});
