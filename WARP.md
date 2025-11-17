# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides multiple tools for customer management and payment processing:
- `createCustomer` - Create customers via external API with Bearer token authentication
- `getAddressByZipcode` - Lookup Brazilian addresses by CEP (zipcode)
- `list_payment_plans` - Retrieve available payment plans for checkout offers

The server is built with TypeScript and uses the `@modelcontextprotocol/sdk` for MCP implementation.

## Development Commands

### Setup
```bash
# Install dependencies (use yarn, not npm)
yarn install

# Configure environment variables
# Create .env file with: CUSTOMER_API_HOST, CUSTOMER_API_TOKEN, NODE_ENV, CHECKOUT_ID, PRODUCT_ID
```

### Development
```bash
# Run in development mode with auto-reload
yarn dev

# Run with watch mode
yarn watch
```

### Build & Production
```bash
# Build TypeScript to JavaScript
yarn build

# Run compiled server
yarn start
```

### Testing the MCP Server
The server runs on stdio and is designed to be consumed by MCP clients (like Claude Desktop). To test locally:
1. Build the project: `yarn build`
2. Configure the MCP client to point to `build/index.js`
3. Ensure environment variables are properly set

## Architecture

### Core Components

**`src/index.ts`** - MCP Server Implementation
- Implements the `CustomerRegistrationServer` class
- Sets up MCP request handlers for `ListTools` and `CallTool`
- Defines three tools:
  - `createCustomer` - Required fields (name, email, phone) + 17 optional fields
  - `getAddressByZipcode` - Brazilian CEP lookup
  - `list_payment_plans` - Payment plan retrieval (no input parameters)
- Handles server lifecycle (SIGINT, error handling)
- Runs on stdio transport for MCP client communication

**`src/services/customerService.ts`** - Customer API Integration & Validation
- `CustomerService` class handles customer creation API calls
- Uses axios for HTTP requests with Bearer token authentication
- Validates required fields (name, email, phone) and email format
- Implements development logging when `NODE_ENV=development`
- Makes POST requests to `/api/v1/customers` endpoint

**`src/services/viaCepService.ts`** - Brazilian Address Lookup
- `ViaCepService` class handles CEP (zipcode) lookups
- Integrates with ViaCEP public API
- Returns street, neighborhood, city, and state information

**`src/services/paymentPlansService.ts`** - Payment Plans Integration
- `PaymentPlansService` class handles payment plan retrieval
- Uses axios for HTTP requests with Bearer token authentication
- Reads `CHECKOUT_ID` and `PRODUCT_ID` from environment variables
- Makes GET requests to `/api/v1/payment_plans` with query parameters
- Processes API response to extract credit card, PIX, and bank slip options
- Generates human-friendly payment summary in Portuguese
- Ignores fine, fine_tax, and late_interest fields from API response

### Data Flow
1. MCP client calls `createCustomer` tool with customer data
2. Server validates required fields using `CustomerService.validateRequiredFields()`
3. If valid, `CustomerService.createCustomer()` makes authenticated POST request
4. Response (success or error) is returned to MCP client as JSON

### Environment Configuration
Required environment variables (must be set in `.env` or passed to MCP client):
- `CUSTOMER_API_HOST` - Base URL of the customer API
- `CUSTOMER_API_TOKEN` - Bearer token for authentication
- `NODE_ENV` - Set to `development` for detailed logging
- `CHECKOUT_ID` - Checkout page identifier for payment plans
- `PRODUCT_ID` - Comma-separated product IDs (e.g., "36,42")

⚠️ **Never commit `.env` files** - they contain sensitive API credentials and are gitignored.

## TypeScript Configuration

- Target: ES2022
- Module system: Node16 (ESM with `.js` extensions in imports)
- Strict mode enabled
- Output directory: `build/`
- Always use `.js` extensions in relative imports (e.g., `import { CustomerService } from './services/customerService.js'`)

## MCP Client Configuration

To integrate this server with an MCP client (e.g., Claude Desktop), add to MCP settings:
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

## Data Models

### Customer Data Model

The `createCustomer` tool accepts:
- **Required**: name, email, phone
- **Optional**: retention, identification, zipcode, state, street, number, neighborhood, city, list_ids, create_deal, tags, url, utm_term, utm_medium, utm_source, utm_campaign, company_id, utm_content

Email validation uses regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Payment Plans Data Model

The `list_payment_plans` tool returns:
```json
{
  "checkout_id": "<checkout_id>",
  "product_id": "36,42",
  "plans": {
    "credit_card": [
      { "installments": 1, "value": 1096.00 },
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

**API Behavior:**
- Single GET request to `/api/v1/payment_plans?product_id=36,42&checkout_page_id=<checkout_id>`
- Backend processes comma-separated product IDs and returns combined payment conditions
- Fine, fine_tax, and late_interest fields are ignored by the service

## Deployment

MCP servers run as long-running processes on platforms like Railway, Render, or VPS (AWS EC2, DigitalOcean). They communicate via stdio for MCP client integration and can also run a chatbot server with HTTP endpoints.

For deployment details, see [DEPLOYMENT.md](./DEPLOYMENT.md).
