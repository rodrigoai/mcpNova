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
import { PaymentPlansService } from './services/paymentPlansService.js';
import { CheckoutService } from './services/checkoutService.js';
import { PaymentService, PaymentPayload } from './services/paymentService.js';

// Load environment variables
config();

class CustomerRegistrationServer {
  private server: Server;
  private customerService: CustomerService;
  private viaCepService: ViaCepService;
  private paymentPlansService: PaymentPlansService;
  private checkoutService: CheckoutService;
  private paymentService: PaymentService;

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
    this.paymentPlansService = new PaymentPlansService();
    this.checkoutService = new CheckoutService();
    this.paymentService = new PaymentService();
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
          description: `Register a new customer in the system. This tool must be used everytime a customer send any information about himself.
          Required fields: name, email, phone, zipcode and identification.
          Optional fields include address details, UTM parameters, and tags. Returns a success and proceed to show the offers using the mcp tool 'list_checkout_offers'.`,
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
            required: ['name', 'email', 'phone', 'zipcode', 'identification'],
          },
        },

        {
          name: 'list_payment_plans',
          description: `Retrieve available payment options (PIX, bank slip) 
          for the user to CHOOSE FROM. Use this tool BEFORE the user makes a purchase decision to show them what options are available. 
          If the user already selected a payment plan, do not use this tool. This tool returns the payment plan IDs along with other details.
          This tool should be used every time the user asks for the list of payment plans or any other payment-type doubt.
          `,
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'list_checkout_offers',
          description: `Retrieve and list all offer-type products from a checkout page. 
          The checkout_id is provided through the environment variable CHECKOUT_ID.
          Returns an array of offer objects containing the id, name, description, value, and image.
          This tool should be used every time the user asks for the list of products, offers, products options or any other product-type doubt.
          `,
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'createPayment',
          description: `EXECUTE the purchase and show the qrcode image in the response.
          Use this tool ONLY AFTER the user has selected a specific payment plan from the tool list_payment_plans, 
          offers from the tool list_checkout_offers and quantity. After this tool is used, show the payment status and qrcode image in the response if it is pix or the link for download if it is bank_slip. 
          In both cases, the status should be "pending" and the qrcode image or link should be displayed in the response.`,
          inputSchema: {
            type: 'object',
            properties: {
              customer_email: {
                type: 'string',
                description: 'Customer email address',
              },
              payment_plan_id: {
                type: 'string',
                description: 'Selected payment plan ID by the tool list_payment_plans',
              },
              checkout_page_id: {
                type: 'string',
                description: 'Checkout page ID provided by the tool list_checkout_offers',
              },
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'number',
                      description: 'Product ID',
                    },
                    quantity: {
                      type: 'string',
                      description: 'Product quantity',
                    },
                  },
                  required: ['id', 'quantity'],
                },
                description: 'List of products to purchase provided by the tool list_checkout_offers',
              },
            },
            required: ['customer_email', 'payment_plan_id', 'checkout_page_id', 'products'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'createCustomer') {
        let customerData = request.params.arguments as Partial<CustomerData>;

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

        // Fetch address from ViaCEP if zipcode is provided
        if (customerData.zipcode) {
          const addressResult = await this.viaCepService.getAddressByZipcode(customerData.zipcode);
          if (addressResult.status === 'success' && addressResult.address) {
            const addressFields = this.viaCepService.convertToCustomerAddress(addressResult.address);
            // Merge address fields into customerData, preferring existing data if any (though usually tool call won't have them if we just asked for zipcode)
            // Actually, we want to use the fetched address.
            customerData = { ...customerData, ...addressFields };
          } else {
            // If address lookup fails, we might want to return an error or proceed.
            // Given the requirement "make the createCustomer tool ask for the zipcode as required info and call the ViaCepService itself",
            // implying we rely on it. Let's return error if zipcode is invalid.
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    error: `Invalid zipcode or address not found: ${addressResult.error || 'Unknown error'}`,
                  }, null, 2),
                },
              ],
            };
          }
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



      if (request.params.name === 'list_payment_plans') {
        // Fetch payment plans from API
        const result = await this.paymentPlansService.listPaymentPlans();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (request.params.name === 'list_checkout_offers') {
        // Fetch checkout offers
        const result = await this.checkoutService.listCheckoutOffers();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (request.params.name === 'createPayment') {
        const payload = request.params.arguments as unknown as PaymentPayload;

        // Create payment
        const result = await this.paymentService.createPayment(payload);

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
