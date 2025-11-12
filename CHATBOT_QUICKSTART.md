# Chatbot Quick Start Guide

This guide will help you get the AI chatbot up and running quickly.

## Prerequisites

- Node.js 18+
- Yarn package manager
- OpenAI API key
- Customer API credentials (host and token)

## Setup in 5 Minutes

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
nano .env  # or use your preferred editor
```

Required values in `.env`:
- `OPENAI_API_KEY` - Your OpenAI API key
- `CUSTOMER_API_HOST` - Your customer API base URL
- `CUSTOMER_API_TOKEN` - Your API bearer token
- `AGENT_TONE` - Chatbot personality (e.g., "Professional, helpful, and efficient")

### 3. Build the Project

```bash
yarn build
```

### 4. Start the Chatbot Server

**Development (with auto-reload):**
```bash
yarn chatbot:dev
```

**Production:**
```bash
yarn chatbot:start
```

The server will start on `http://localhost:3000` (or your configured port).

## Test the Chatbot

### Option 1: Using curl

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Can you help me register a customer?"
  }'
```

### Option 2: Using the Test Script

```bash
./test-chatbot.sh
```

This script runs multiple test scenarios including:
- Health check
- Simple conversation
- Customer registration
- Multi-turn conversation

## Customizing the Agent Tone

The chatbot's personality is controlled by the `AGENT_TONE` environment variable. Try different styles:

**Professional:**
```env
AGENT_TONE=Professional, helpful, and efficient
```

**Friendly:**
```env
AGENT_TONE=Friendly, enthusiastic, and encouraging
```

**Witty:**
```env
AGENT_TONE=Witty, clever, and engaging
```

**Formal:**
```env
AGENT_TONE=Formal, precise, and business-like
```

After changing the tone, restart the chatbot server to apply changes.

## API Endpoints Overview

### POST /api/chat
Main chatbot endpoint. Send messages and receive responses.

**Request:**
```json
{
  "message": "Your message here",
  "context": {
    "optional": "context data"
  }
}
```

**Response:**
```json
{
  "reply": "Chatbot response",
  "actions": [
    {
      "tool": "createCustomer",
      "input": {...},
      "result": {...}
    }
  ]
}
```

### POST /api/chat/reset
Reset conversation history (useful for testing or starting fresh).

### GET /health
Health check endpoint.

## Example Conversations

### Simple Registration

**Input:**
```json
{
  "message": "Register: John Doe, john@example.com, 555-1234"
}
```

**Output:**
```json
{
  "reply": "I've successfully registered John Doe! Customer ID: 12345",
  "actions": [...]
}
```

### Multi-turn Conversation

**Message 1:**
```
"I need to add a new customer"
```

**Response 1:**
```
"I'd be happy to help! I'll need the customer's name, email, and phone number."
```

**Message 2:**
```
"Name is Jane Smith, email jane@smith.com, phone 555-9999"
```

**Response 2:**
```
"Perfect! I've registered Jane Smith. Customer ID: 67890"
```

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"

**Solution:** Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### "MCP request timeout" or "Failed to initialize MCP client"

**Solution:** 
1. Ensure the project is built: `yarn build`
2. Check that `build/index.js` exists
3. Verify your customer API credentials are correct

### OpenAI API Rate Limit Errors

**Solution:** 
1. Check your OpenAI account has available credits
2. Ensure you have access to `gpt-4o-mini` model
3. Consider implementing rate limiting in your application

### Customer API Returns Errors

**Solution:**
1. Verify `CUSTOMER_API_HOST` is correct
2. Check that `CUSTOMER_API_TOKEN` is valid
3. Set `NODE_ENV=development` for detailed error logs
4. Review the API documentation for required fields

## Architecture

```
┌──────────┐         ┌─────────────┐         ┌─────────────┐
│  Client  │ ──HTTP─→│   Chatbot   │ ──stdio→│ MCP Server  │
│          │         │  (Express)  │         │             │
└──────────┘         └─────────────┘         └─────────────┘
                           │                        │
                           ↓                        ↓
                     ┌──────────┐            ┌──────────┐
                     │  OpenAI  │            │ Customer │
                     │ GPT-4o   │            │   API    │
                     │   mini   │            │          │
                     └──────────┘            └──────────┘
```

## Next Steps

- Integrate the chatbot with your frontend application
- Add authentication/authorization to the REST API
- Implement conversation persistence (database)
- Add more MCP tools beyond `createCustomer`
- Set up monitoring and logging
- Deploy to production (AWS, GCP, Azure, etc.)

## Support

For issues or questions:
1. Check the main README.md
2. Review the WARP.md project guide
3. Examine logs when `NODE_ENV=development`

## License

MIT
