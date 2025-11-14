#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { CustomerService, CustomerData } from './services/customerService.js';
import { ViaCepService } from './services/viaCepService.js';

// Load environment variables
config();

class CustomerRegistrationServer {
  private server: Server;
  private customerService: CustomerService;
  private viaCepService: ViaCepService;

  constructor() {
    this.server = new Server(
      {
        name: 'customer-registration-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.customerService = new CustomerService();
    this.viaCepService = new ViaCepService();
    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'createCustomer',
          description: 'Create a new customer in the external API. Requires name, email, and phone. Supports optional fields like address, UTM parameters, and more.',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Customer full name (required)',
              },
              email: {
                type: 'string',
                description: 'Customer email address (required)',
              },
              phone: {
                type: 'string',
                description: 'Customer phone number (required)',
              },
              retention: {
                type: 'boolean',
                description: 'Retention flag',
              },
              identification: {
                type: 'string',
                description: 'Customer identification document (e.g., CPF)',
              },
              zipcode: {
                type: 'string',
                description: 'ZIP/Postal code',
              },
              state: {
                type: 'string',
                description: 'State/Province',
              },
              street: {
                type: 'string',
                description: 'Street name',
              },
              number: {
                type: 'string',
                description: 'Street number',
              },
              neighborhood: {
                type: 'string',
                description: 'Neighborhood',
              },
              city: {
                type: 'string',
                description: 'City',
              },
              list_ids: {
                type: 'number',
                description: 'List ID for categorization',
              },
              create_deal: {
                type: 'boolean',
                description: 'Whether to create a deal',
              },
              tags: {
                type: 'string',
                description: 'Tags for the customer',
              },
              url: {
                type: 'string',
                description: 'URL reference',
              },
              utm_term: {
                type: 'string',
                description: 'UTM term parameter',
              },
              utm_medium: {
                type: 'string',
                description: 'UTM medium parameter',
              },
              utm_source: {
                type: 'string',
                description: 'UTM source parameter',
              },
              utm_campaign: {
                type: 'string',
                description: 'UTM campaign parameter',
              },
              company_id: {
                type: 'string',
                description: 'Company ID',
              },
              utm_content: {
                type: 'string',
                description: 'UTM content parameter',
              },
            },
            required: ['name', 'email', 'phone'],
          },
        },
        {
          name: 'getAddressByZipcode',
          description: 'Lookup Brazilian address by CEP (zipcode). Returns street, neighborhood, city, state information from ViaCEP API.',
          inputSchema: {
            type: 'object',
            properties: {
              zipcode: {
                type: 'string',
                description: 'Brazilian CEP (zipcode) in format XXXXX-XXX or XXXXXXXX (8 digits)',
              },
            },
            required: ['zipcode'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'createCustomer') {
        const customerData = request.params.arguments as Partial<CustomerData>;

        // Validate required fields
        const validation = this.customerService.validateRequiredFields(customerData);
        if (!validation.valid) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: 'Validation failed',
                  errors: validation.errors,
                }, null, 2),
              },
            ],
          };
        }

        // Create customer
        const result = await this.customerService.createCustomer(customerData as CustomerData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (request.params.name === 'getAddressByZipcode') {
        const { zipcode } = request.params.arguments as { zipcode: string };

        if (!zipcode) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: 'Zipcode is required',
                }, null, 2),
              },
            ],
          };
        }

        // Fetch address from ViaCEP
        const result = await this.viaCepService.getAddressByZipcode(zipcode);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Customer Registration MCP server running on stdio');
  }
}

const server = new CustomerRegistrationServer();
server.run().catch(console.error);
