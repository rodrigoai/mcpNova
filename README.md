# Customer Management & Payment Plans MCP Server & Chatbot

This project provides two main components:
1. **MCP Server**: A Model Context Protocol server for customer management, address lookup, and payment plan retrieval
2. **AI Chatbot**: An OpenAI GPT-4o-mini powered chatbot that integrates with the MCP server via REST API

## Features

### MCP Server
- ✅ MCP-compliant server implementation (stdio transport)
- ✅ Bearer token authentication
- ✅ Three integrated tools:
  - `createCustomer` - Customer registration with validation
  - `getAddressByZipcode` - Brazilian CEP address lookup
  - `list_payment_plans` - Payment plan retrieval (credit card, PIX, bank slip)
- ✅ Required field validation
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

# Payment Plans Configuration
CHECKOUT_ID=your_checkout_id_here
PRODUCT_ID=36,42

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

## MCP Tools

### Tool 1: createCustomer

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

### Tool 2: getAddressByZipcode

Lookup Brazilian addresses by CEP (zipcode).

#### Required Parameters

- `zipcode` (string): Brazilian CEP in format XXXXX-XXX or XXXXXXXX (8 digits)

#### Example Request

```json
{
  "zipcode": "01310-100"
}
```

#### Example Success Response

```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP"
}
```

### Tool 3: list_payment_plans

Retrieve available payment plans for checkout offers. Configuration is read from environment variables (`CHECKOUT_ID` and `PRODUCT_ID`).

#### Required Parameters

None - the tool uses configuration from environment variables.

#### Configuration (Environment Variables)

- `CHECKOUT_ID` (string): Checkout page identifier
- `PRODUCT_ID` (string): Comma-separated product IDs (e.g., "36,42")

#### Example Response

```json
{
  "checkout_id": "checkout_abc123",
  "product_id": "36,42",
  "plans": {
    "credit_card": [
      { "installments": 1, "value": 1096.00 },
      { "installments": 2, "value": 548.00 },
      { "installments": 3, "value": 365.33 },
      { "installments": 6, "value": 182.67 },
      { "installments": 12, "value": 91.33 }
    ],
    "pix": [
      { "value": 1096.00 }
    ],
    "bank_slip": [
      { "value": 1096.00 }
    ]
  },
  "payment_summary": "Temos pagamentos em até 12x de R$ 91,33 no cartão de crédito, ou à vista no PIX por R$ 1.096,00 ou boleto por R$ 1.096,00."
}
```

#### Notes

- The API is called once with the full `product_id` string (comma-separated)
- Backend processes multiple product IDs and returns combined payment conditions
- Fine, fine_tax, and late_interest fields are automatically ignored
- Payment summary is generated in Portuguese (Brazil)

#### Example Error Response

```json
{
  "error": "Request failed with status code 401",
  "statusCode": 401
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
        "NODE_ENV": "production",
        "CHECKOUT_ID": "your_checkout_id",
        "PRODUCT_ID": "36,42"
      }
    }
  }
}
```

## How the Chatbot Works

1. User sends a message to `/api/chat`
2. Chatbot adds message to conversation history
3. OpenAI GPT-4o-mini processes the message with configured system prompt
4. If LLM determines an action is needed (e.g., `createCustomer`, `getAddressByZipcode`, `list_payment_plans`), it responds with JSON
5. Chatbot extracts the action and calls MCP server via stdio
6. MCP server executes the appropriate tool:
   - Customer registration via external API
   - Address lookup via ViaCEP
   - Payment plans retrieval via external API
7. Result is returned to LLM for a friendly follow-up message in Portuguese
8. Final response sent back to user

## Example Chatbot Conversations

**Customer Registration:**

User: `Preciso cadastrar um cliente: João Silva, joao@email.com, (11) 98765-4321`

Chatbot: `Perfeito! Cadastrei o João Silva com sucesso. O ID do cliente é 67890.`

**Address Lookup:**

User: `Qual endereço do CEP 01310-100?`

Chatbot: `O CEP 01310-100 corresponde a:
- Avenida Paulista
- Bairro: Bela Vista
- São Paulo - SP`

**Payment Plans:**

User: `Quais são as formas de pagamento?`

Chatbot: `Temos as seguintes opções:
- Cartão de crédito: até 12x de R$ 91,33
- PIX à vista: R$ 1.096,00
- Boleto à vista: R$ 1.096,00`

**Multi-turn with Address:**

User: `Quero cadastrar um cliente`

Chatbot: `Claro! Preciso de:
- Nome completo
- E-mail
- Telefone`

User: `Nome: Maria Santos, Email: maria@email.com, Telefone: (21) 99999-8888, CEP: 20040-020`

Chatbot: *(looks up CEP)* `Encontrei o endereço: Avenida Rio Branco, Centro, Rio de Janeiro - RJ. Vou cadastrar a Maria Santos com essas informações.`

*(creates customer)*

Chatbot: `Pronto! Maria Santos cadastrada com sucesso. ID: 11223`

## Project Structure

```
mcpNova/
├── src/
│   ├── index.ts                  # MCP Server (stdio)
│   ├── chatbotServer.ts          # Express REST API server
│   └── services/
│       ├── customerService.ts    # Customer API integration
│       ├── viaCepService.ts      # Brazilian address lookup
│       ├── paymentPlansService.ts # Payment plans retrieval
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
