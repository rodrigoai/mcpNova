import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CustomerData } from './customerService.js';

export interface MCPAction {
  tool: string;
  input: any;
  result?: any;
  error?: string;
}

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor(private mcpServerPath: string) {}

  async initialize(): Promise<void> {
    if (this.client) {
      return; // Already initialized
    }

    console.log('[MCP Client] Initializing with server path:', this.mcpServerPath);

    try {
      // Create transport
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [this.mcpServerPath],
        env: process.env as Record<string, string>,
      });

      // Create client
      this.client = new Client(
        {
          name: 'chatbot-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);
      console.log('[MCP Client] Connected successfully');

      // List available tools
      const tools = await this.client.listTools();
      console.log('[MCP Client] Available tools:', tools.tools.map(t => t.name));
    } catch (error) {
      console.error('[MCP Client] Initialization error:', error);
      throw error;
    }
  }

  async getAddressByZipcode(zipcode: string): Promise<MCPAction> {
    const action: MCPAction = {
      tool: 'getAddressByZipcode',
      input: { zipcode },
    };

    console.log('[MCP Client] Looking up address for zipcode:', zipcode);

    try {
      if (!this.client) {
        await this.initialize();
      }

      const result = await this.client!.callTool({
        name: 'getAddressByZipcode',
        arguments: { zipcode } as Record<string, unknown>,
      });
      
      console.log('[MCP Client] Raw result:', JSON.stringify(result, null, 2));
      
      // Parse the text content from MCP response
      if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0] as any;
        if (firstContent && firstContent.text) {
          action.result = JSON.parse(firstContent.text);
          console.log('[MCP Client] Parsed result:', action.result);
        } else {
          action.result = result;
        }
      } else {
        action.result = result;
      }
    } catch (error) {
      console.error('[MCP Client] Error looking up address:', error);
      action.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return action;
  }

  async createCustomer(customerData: CustomerData): Promise<MCPAction> {
    const action: MCPAction = {
      tool: 'createCustomer',
      input: customerData,
    };

    console.log('[MCP Client] Creating customer:', customerData);

    try {
      if (!this.client) {
        await this.initialize();
      }

      const result = await this.client!.callTool({
        name: 'createCustomer',
        arguments: customerData as unknown as Record<string, unknown>,
      });
      
      console.log('[MCP Client] Raw result:', JSON.stringify(result, null, 2));
      
      // Parse the text content from MCP response
      if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0] as any;
        if (firstContent && firstContent.text) {
          action.result = JSON.parse(firstContent.text);
          console.log('[MCP Client] Parsed result:', action.result);
        } else {
          action.result = result;
        }
      } else {
        action.result = result;
      }
    } catch (error) {
      console.error('[MCP Client] Error creating customer:', error);
      action.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return action;
  }

  async shutdown(): Promise<void> {
    console.log('[MCP Client] Shutting down');
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
    } catch (error) {
      console.error('[MCP Client] Shutdown error:', error);
    }
  }
}
