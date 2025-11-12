# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides a `createCustomer` tool for creating customers via an external API with Bearer token authentication. The server is built with TypeScript and uses the `@modelcontextprotocol/sdk` for MCP implementation.

## Development Commands

### Setup
```bash
# Install dependencies (use yarn, not npm)
yarn install

# Configure environment variables
# Create .env file with: CUSTOMER_API_HOST, CUSTOMER_API_TOKEN, NODE_ENV
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
- Defines the `createCustomer` tool schema with required fields (name, email, phone) and 17 optional fields
- Handles server lifecycle (SIGINT, error handling)
- Runs on stdio transport for MCP client communication

**`src/services/customerService.ts`** - API Integration & Validation
- `CustomerService` class handles all external API communication
- Uses axios for HTTP requests with Bearer token authentication
- Validates required fields (name, email, phone) and email format
- Implements development logging when `NODE_ENV=development`
- Makes POST requests to `/api/v1/customers` endpoint

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
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Customer Data Model

The `createCustomer` tool accepts:
- **Required**: name, email, phone
- **Optional**: retention, identification, zipcode, state, street, number, neighborhood, city, list_ids, create_deal, tags, url, utm_term, utm_medium, utm_source, utm_campaign, company_id, utm_content

Email validation uses regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

## Deployment

The project includes `vercel.json` for potential Vercel deployment, though MCP servers typically run locally as stdio processes for MCP client integration.
