# Quick Start Guide

## Setup (First Time)

1. **Configure your API credentials** in `.env`:
   ```bash
   CUSTOMER_API_HOST=https://your-actual-api-host.com
   CUSTOMER_API_TOKEN=your_actual_bearer_token
   NODE_ENV=development
   ```

2. **Build the project**:
   ```bash
   yarn build
   ```

3. **Test the server** (development mode):
   ```bash
   yarn dev
   ```

## Using with Claude Desktop (or other MCP clients)

1. Find your Claude Desktop MCP configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the server configuration:
   ```json
   {
     "mcpServers": {
       "customer-registration": {
         "command": "node",
         "args": ["/Users/rcslima/projects/mcpNova/build/index.js"],
         "env": {
           "CUSTOMER_API_HOST": "https://your-api-host.com",
           "CUSTOMER_API_TOKEN": "your_bearer_token_here",
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

4. The `createCustomer` tool will now be available!

## Testing the Tool

Once connected to an MCP client, you can create customers like this:

```
Create a customer with:
- Name: Tony Stark
- Email: tony@stark.com
- Phone: (12) 99999-9999
- City: São Paulo
```

The MCP client will call the `createCustomer` tool with the provided parameters and return the result.

## Troubleshooting

### "Missing required environment variables"
- Check that your `.env` file exists and has the correct values
- Make sure `CUSTOMER_API_HOST` and `CUSTOMER_API_TOKEN` are set

### "Connection refused" or timeout errors
- Verify your API host URL is correct
- Check that your Bearer token is valid
- Ensure you have network connectivity to the API

### Tool not appearing in Claude Desktop
- Make sure the path in `claude_desktop_config.json` is absolute and correct
- Restart Claude Desktop after making configuration changes
- Check Claude Desktop logs for errors

## Development Commands

- `yarn dev` - Run in development mode with logging
- `yarn watch` - Run with auto-reload on file changes
- `yarn build` - Compile TypeScript to JavaScript
- `yarn start` - Run the compiled production build
