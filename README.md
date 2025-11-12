# Customer Registration MCP Server

A Model Context Protocol (MCP) server for creating customers via an external API with Bearer token authentication.

<a href="https://glama.ai/mcp/servers/@rodrigoai/mcpNova">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@rodrigoai/mcpNova/badge" alt="Customer Registration Server MCP server" />
</a>

## Features

- ✅ MCP-compliant server implementation
- ✅ Bearer token authentication
- ✅ Required field validation (name, email, phone)
- ✅ Support for all optional customer fields
- ✅ Comprehensive error handling
- ✅ Development logging
- ✅ TypeScript implementation

## Prerequisites

- Node.js 18+ 
- Yarn package manager

## Installation

1. Install dependencies:

```bash
yarn install
```

2. Configure environment variables:

Create a `.env` file in the root directory:

```env
# Customer API Configuration
CUSTOMER_API_HOST=https://your-api-host.com
CUSTOMER_API_TOKEN=your_bearer_token_here

# Development mode (set to 'true' for detailed logging)
NODE_ENV=development
```

## Usage

### Development Mode

Run the server with auto-reload:

```bash
yarn dev
```

Or with watch mode:

```bash
yarn watch
```

### Production Mode

1. Build the project:

```bash
yarn build
```

2. Run the compiled server:

```bash
yarn start
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

## Project Structure

```
/mcpNova
  /src
    /services
      customerService.ts    # API integration and validation logic
    index.ts               # MCP server implementation
  .env                     # Environment variables (not committed)
  .gitignore              
  package.json            
  tsconfig.json           
  README.md               
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