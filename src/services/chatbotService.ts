import OpenAI from 'openai';
import { MCPClient, MCPAction } from './mcpClient.js';
import { CustomerData } from './customerService.js';

export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  reply: string;
  actions: MCPAction[];
}

export class ChatbotService {
  private openai: OpenAI;
  private mcpClient: MCPClient;
  private systemPrompt: string;
  private model: string;
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  constructor(mcpServerPath: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
    this.mcpClient = new MCPClient(mcpServerPath);

    // Build system prompt from configurable tone/style
    const agentTone = process.env.AGENT_TONE || process.env.AGENT_STYLE || 'Professional, helpful, and efficient';
    this.systemPrompt = this.buildSystemPrompt(agentTone);

    // Set model from env or default
    this.model = process.env.OPENAI_MODEL || 'gpt-5-nano';

    // Initialize conversation with system prompt
    this.conversationHistory.push({
      role: 'system',
      content: this.systemPrompt,
    });
  }

  private buildSystemPrompt(tone: string): string {
    return `You are a brazilian customer service assistant with the following tone and style: ${tone}.
You speak brazilian portuguese.

You can help users with:
- 📋 Customer registration (collecting and creating customer records)
- 📍 Address lookup by CEP (Brazilian zipcode)
- 💳 Payment plan information (credit card installments, PIX, bank slip)

You have access to these tools:
1. "getAddressByZipcode" - Lookup address information by Brazilian CEP (zipcode)
   - Use this when user provides a CEP or asks about an address
   
2. "createCustomer" - Register new customers in the system
   - Use this when user wants to register a customer with name, email, and phone
   
3. "list_payment_plans" - Retrieve available payment plans for checkout offers
   - Use this when user asks about payment options, installments, pricing, PIX, or boleto

4. "list_checkout_offers" - Retrieve and list all offer-type products from a checkout page
   - Use this when user asks for offers, products, prices, or what is available for sale

When a user wants to create a customer, you must collect the following REQUIRED information:
- name (full name)
- email (valid email address)
- phone (phone number)

You can also collect these OPTIONAL fields if the user provides them:
- retention (boolean)
- identification (e.g., CPF)
- zipcode
- state
- street
- number
- neighborhood
- city
- list_ids (number)
- create_deal (boolean)
- tags
- url
- utm_term
- utm_medium
- utm_source
- utm_campaign
- company_id
- utm_content

IMPORTANT: When a user provides a CEP (Brazilian zipcode), you should:
1. First look up the address using getAddressByZipcode
2. Use the returned address information to auto-fill the customer address fields
3. Then proceed with customer creation

To lookup an address, respond with:
{
  "action": "getAddressByZipcode",
  "data": {
    "zipcode": "XXXXX-XXX"
  }
}

When you have collected the required customer information, respond with:
{
  "action": "createCustomer",
  "data": {
    "name": "...",
    "email": "...",
    "phone": "...",
    "zipcode": "...",
    "street": "...",
    "neighborhood": "...",
    "city": "...",
    "state": "..."
    // ... any other optional fields
  }
}

When a user asks about payment plans, payment options, installments, or pricing, respond with:
{
  "action": "list_payment_plans",
  "data": {}
}

When a user asks for offers, products, or prices (and not specifically payment plans), respond with:
{
  "action": "list_checkout_offers",
  "data": {}
}

The payment plans tool will return credit card installment options, PIX and bank slip payment options with a friendly summary in Portuguese.

If the user's request is unclear or missing required information, ask clarifying questions in a ${tone.toLowerCase()} manner.

For any other questions or conversations, respond naturally according to your configured tone.`;
  }

  async initialize(): Promise<void> {
    await this.mcpClient.initialize();
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, context } = request;
    const actions: MCPAction[] = [];

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: context
        ? `${message}\n\nAdditional context: ${JSON.stringify(context)}`
        : message,
    });

    try {
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        temperature: 1,
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage || !assistantMessage.content) {
        throw new Error('No response from OpenAI');
      }

      const responseContent = assistantMessage.content;

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseContent,
      });

      // Check if the response contains an action to execute
      const action = this.extractAction(responseContent);

      if (action) {
        // Execute the MCP action
        const mcpAction = await this.executeMCPAction(action);
        actions.push(mcpAction);

        // Generate a friendly response based on the action result
        const followUpMessage = await this.generateFollowUpResponse(mcpAction);

        return {
          reply: followUpMessage,
          actions,
        };
      }

      return {
        reply: responseContent,
        actions,
      };
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      throw error;
    }
  }

  private extractAction(response: string): { action: string; data: any } | null {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action && parsed.data) {
          return parsed;
        }
      }
    } catch (error) {
      // Not a valid action, return null
    }
    return null;
  }

  private async executeMCPAction(action: { action: string; data: any }): Promise<MCPAction> {
    switch (action.action) {
      case 'getAddressByZipcode':
        return await this.mcpClient.getAddressByZipcode(action.data.zipcode);

      case 'createCustomer':
        return await this.mcpClient.createCustomer(action.data as CustomerData);

      case 'list_payment_plans':
        return await this.mcpClient.listPaymentPlans();

      case 'list_checkout_offers':
        return await this.mcpClient.listCheckoutOffers();

      default:
        return {
          tool: action.action,
          input: action.data,
          error: `Unknown action: ${action.action}`,
        };
    }
  }

  private async generateFollowUpResponse(mcpAction: MCPAction): Promise<string> {
    const resultSummary = mcpAction.error
      ? `Error: ${mcpAction.error}`
      : `Success: ${JSON.stringify(mcpAction.result, null, 2)}`;

    // Ask OpenAI to generate a friendly response
    this.conversationHistory.push({
      role: 'system',
      content: `The ${mcpAction.tool} action was executed with the following result:\n${resultSummary}\n\nGenerate a friendly response to inform the user about the result.`,
    });

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: this.conversationHistory,
      temperature: 1,
    });

    const response = completion.choices[0]?.message?.content || 'Action completed.';

    // Add this to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response,
    });

    return response;
  }

  resetConversation(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];
  }

  async shutdown(): Promise<void> {
    await this.mcpClient.shutdown();
  }
}
