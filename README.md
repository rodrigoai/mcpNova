# Customer Registration MCP Server & Chatbot

This project provides two main components:
1. **MCP Server**: A Model Context Protocol server for customer registration via an external API
2. **AI Chatbot**: An OpenAI GPT-4o-mini powered chatbot that integrates with the MCP server via REST API

<a href="https://glama.ai/mcp/servers/@rodrigoai/mcpNova">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@rodrigoai/mcpNova/badge" alt="Customer Registration Server MCP server" />
</a>

## Features

### MCP Server
- ✅ MCP-compliant server implementation (stdio transport)
- ✅ Bearer token authentication
- ✅ Required field validation (name, email, phone)
- ✅ Support for all optional customer fields
- ✅ Comprehensive error handling
- ✅ Development logging
- ✅ TypeScript implementation

### AI Chatbot
- ✅ OpenAI GPT-4o-mini integration
- ✅ Configurable tone/style via environment variables
- ✅ REST API endpoint (`/api/chat`)
- ✅ Automatic MCP tool invocation based on conversation
- ✅ Conversation history management
- ✅ Express-based HTTP server

## Prerequisites

- Node.js 18+ 
- Yarn package manager

## Installation

1. Install dependencies:

```bash
yarn install
```

2. Configure environment variables:

Copy the example file and edit with your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# MCP Server Configuration
CUSTOMER_API_HOST=https://your-api-host.com
CUSTOMER_API_TOKEN=your_bearer_token_here
NODE_ENV=development

# Chatbot Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
AGENT_TONE=Professional, helpful, and efficient
# Alternative: AGENT_STYLE=Encouraging, visionary, witty

# Chatbot Server Port (optional, defaults to 3000)
CHATBOT_PORT=3000
```

**Note**: `AGENT_TONE` or `AGENT_STYLE` controls the chatbot's personality.

## Usage

### Running the MCP Server (standalone)

**Development Mode:**

```bash
yarn dev
```

Or with watch mode:

```bash
yarn watch
```

**Production Mode:**

```bash
# Build
yarn build

# Run
yarn start
```

### Running the AI Chatbot Server

**Development Mode:**

```bash
yarn chatbot:dev
```

**Production Mode:**

```bash
# Build
yarn chatbot:build

# Run
yarn chatbot:start
```

The chatbot server will start on port 3000 (or your configured `CHATBOT_PORT`).

## Chatbot API Endpoints

### POST /api/chat

Send a message to the chatbot:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Register a customer: John Doe, john@example.com, +1234567890",
    "context": {}
  }'
```

**Response:**

```json
{
  "reply": "Great! I've successfully registered John Doe as a customer. The customer ID is 12345.",
  "actions": [
    {
      "tool": "createCustomer",
      "input": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "result": {
        "status": "success",
        "customerId": 12345,
        "data": {...}
      }
    }
  ]
}
```

### POST /api/chat/reset

Reset the conversation history:

```bash
curl -X POST http://localhost:3000/api/chat/reset
```

### GET /health

Health check:

```bash
curl http://localhost:3000/health
```

## MCP Tool: createCustomer

### Required Parameters

- `name` (string): Customer full name
- `email` (string): Customer email address (validated)
- `phone` (string): Customer phone number

### Optional Parameters

- `retention` (boolean): Retention flag
- `identification` (string): Customer ID document (e.g., CPF)
- `zipcode` (string): ZIP/Postal code
- `state` (string): State/Province
- `street` (string): Street name
- `number` (string): Street number
- `neighborhood` (string): Neighborhood
- `city` (string): City
- `list_ids` (number): List ID for categorization
- `create_deal` (boolean): Whether to create a deal
- `tags` (string): Tags for the customer
- `url` (string): URL reference
- `utm_term` (string): UTM term parameter
- `utm_medium` (string): UTM medium parameter
- `utm_source` (string): UTM source parameter
- `utm_campaign` (string): UTM campaign parameter
- `company_id` (string): Company ID
- `utm_content` (string): UTM content parameter

### Example Request

```json
{
  "name": "Tony Stark",
  "email": "newone@avengers.com",
  "phone": "(12) 99756-0001",
  "city": "São Paulo",
  "retention": true,
  "identification": "251.482.720-58",
  "tags": "coyo-jan"
}
```

### Example Success Response

```json
{
  "status": "success",
  "customerId": 12345,
  "data": {
    "id": 12345,
    "name": "Tony Stark",
    "email": "newone@avengers.com",
    ...
  }
}
```

### Example Error Response

```json
{
  "status": "error",
  "error": "Validation failed",
  "errors": [
    "email is required",
    "phone is required"
  ]
}
```

## Configuring with MCP Clients

To use this server with an MCP-compatible client (like Claude Desktop), add the following to your MCP settings configuration:

```json
{
  "mcpServers": {
    "customer-registration": {
      "command": "node",
      "args": ["/absolute/path/to/mcpNova/build/index.js"],
      "env": {
        "CUSTOMER_API_HOST": "https://your-api-host.com",
        "CUSTOMER_API_TOKEN": "your_bearer_token_here",
        "NODE_ENV": "production"
      }
    }
  }
}
```

## How the Chatbot Works

1. User sends a message to `/api/chat`
2. Chatbot adds message to conversation history
3. OpenAI GPT-4o-mini processes the message with configured system prompt
4. If LLM determines an action is needed (e.g., `createCustomer`), it responds with JSON
5. Chatbot extracts the action and calls MCP server via stdio
6. MCP server validates data and calls the external customer API
7. Result is returned to LLM for a friendly follow-up message
8. Final response sent back to user

## Example Chatbot Conversations

**Simple Registration:**

User: `Register a customer: Jane Smith, jane@smith.com, +1-555-1234`

Chatbot: `I've successfully registered Jane Smith! The customer ID is 67890.`

**Multi-turn Conversation:**

User: `I need to add a new customer`

Chatbot: `I'd be happy to help! I'll need:
- Full name
- Email address
- Phone number`

User: `Name: Bob Johnson, Email: bob@johnson.com, Phone: 555-9876, City: New York`

Chatbot: `Perfect! I've registered Bob Johnson. Customer ID: 11223`

## Project Structure

```
mcpNova/
├── src/
│   ├── index.ts                  # MCP Server (stdio)
│   ├── chatbotServer.ts          # Express REST API server
│   └── services/
│       ├── customerService.ts    # Customer API integration
│       ├── mcpClient.ts          # MCP client (stdio communication)
│       └── chatbotService.ts     # OpenAI integration & logic
├── build/                        # Compiled TypeScript
├── package.json
├── tsconfig.json
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
└── README.md
```

## API Endpoint

**POST** `https://{{host}}/api/v1/customers`

**Headers:**
- `Authorization: Bearer {{TOKEN}}`
- `Content-Type: application/json`

## Development Logging

When `NODE_ENV=development`, the server logs:
- Request URLs and payloads
- Response status and data
- API errors with details

## Error Handling

The server handles:
- Missing or invalid required fields
- HTTP errors from the external API
- Network connectivity issues
- Invalid Bearer tokens
- Malformed requests

## Security

- Environment variables are used for sensitive data (API host and token)
- `.env` files are gitignored
- Bearer token is never logged or exposed
- Email validation prevents basic injection attempts

## License

MIT