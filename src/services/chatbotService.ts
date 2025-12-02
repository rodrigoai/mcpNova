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
  private tools: OpenAI.Chat.ChatCompletionTool[] = [];

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
    return `You are a brazilian seller assistant with the following tone and style: ${tone}.
You speak brazilian portuguese.

Your goal is to help customers complete their purchase. Follow this conversation flow:

1. **Customer Registration**: Collect customer information (name, email, phone, zipcode, identification). Once you have all required details, use the "createCustomer" tool. The tool will automatically look up the address using the zipcode.

2. **Show Products**: After customer registration, use the "list_checkout_offers" tool to display available products. When showing offers, ALWAYS include product images using HTML <img> tags: <img src="image_url" alt="Product Name" style="max-width: 100%; height: auto;" />. Ask the customer to choose a product and quantity.

3. **Payment Options**: Use the "list_payment_plans" tool to show available payment methods (PIX and bank slip). Ask the customer to choose their preferred payment method.

4. **Complete Purchase**: Once you have:
   - Customer email
   - Selected payment plan ID
   - Selected checkout page ID
   - Product(s) with quantities
   
   Use the "createPayment" tool to finalize the purchase.

5. **Show Payment Details**: After payment creation:
   - For PIX: Display the QR code image using <img src="pix_qr_code_url" alt="PIX QR Code" style="max-width: 300px;" />
   - For bank slip: Provide the download link
   - Show payment status and expiration time

**Important guidelines**:
- Always be ${tone.toLowerCase()}
- Every question about buying should be answered using the list_checkout_offers tool. Do not answer with any other products that is not provided by the tool
- Ask clarifying questions if information is missing
- Use the available tools to retrieve and display information
- Display images prominently for products and QR codes
- Be concise and direct
- Only help with purchase-related questions
- Never suggest sending information via email
`;
  }

  async initialize(): Promise<void> {
    await this.mcpClient.initialize();

    // Fetch and store tools for OpenAI function calling
    this.tools = await this.mcpClient.getToolsForOpenAI();
    console.log('[Chatbot] Loaded tools for OpenAI:', this.tools.map((t: any) => t.function.name));
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
      // Call OpenAI API with tools
      console.log('[Chatbot] Calling OpenAI with', this.tools.length, 'tools available');
      console.log('[Chatbot] Tools:', JSON.stringify(this.tools.map((t: any) => t.function.name)));

      let completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        tools: this.tools.length > 0 ? this.tools : undefined,
        tool_choice: this.tools.length > 0 ? 'auto' : undefined,
        temperature: 1,
      });

      let assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from OpenAI');
      }

      console.log('[Chatbot] Assistant message:', {
        content: assistantMessage.content?.substring(0, 100),
        tool_calls: assistantMessage.tool_calls?.length || 0,
        finish_reason: completion.choices[0]?.finish_reason
      });

      // Add assistant response to history
      this.conversationHistory.push(assistantMessage);

      // Check if the assistant wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('[Chatbot] Tool calls requested:', assistantMessage.tool_calls.map(tc => tc.type === 'function' ? tc.function.name : 'unknown'));

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          // Only handle function tool calls
          if (toolCall.type !== 'function') {
            continue;
          }

          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[Chatbot] Executing tool: ${functionName}`, functionArgs);

          // Execute the MCP action
          const mcpAction = await this.executeMCPAction({
            action: functionName,
            data: functionArgs,
          });
          actions.push(mcpAction);

          // Add tool result to conversation history
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(mcpAction.result || { error: mcpAction.error }),
          });
        }

        // Make another API call to get the final response with tool results
        completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: this.conversationHistory,
          tools: this.tools.length > 0 ? this.tools : undefined,
          tool_choice: this.tools.length > 0 ? 'auto' : undefined,
          temperature: 1,
        });

        assistantMessage = completion.choices[0]?.message;
        if (!assistantMessage) {
          throw new Error('No response from OpenAI after tool execution');
        }

        console.log('[Chatbot] Post-tool assistant message:', {
          content: assistantMessage.content?.substring(0, 100),
          has_tool_calls: !!assistantMessage.tool_calls?.length,
          finish_reason: completion.choices[0]?.finish_reason
        });

        // Add final response to history
        this.conversationHistory.push(assistantMessage);

        // Check if assistant wants to make another tool call (recursive)
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          console.log('[Chatbot] Assistant wants to make another tool call after initial tools');
          // Recursively handle this by making another chat call
          // We've already added the message to history, so just make the API call again
          return this.continueToolCalling(actions);
        }

        return {
          reply: assistantMessage.content || 'Action completed successfully.',
          actions,
        };
      }

      // No tool calls, return the assistant's response directly
      return {
        reply: assistantMessage.content || 'I apologize, but I was unable to generate a response.',
        actions,
      };
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      throw error;
    }
  }

  private async continueToolCalling(existingActions: MCPAction[]): Promise<ChatResponse> {
    // Continue processing tool calls recursively
    console.log('[Chatbot] Continuing with more tool calls...');

    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
    const actions: MCPAction[] = [...existingActions];

    if (lastMessage.role === 'assistant' && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      // Execute each tool call
      for (const toolCall of lastMessage.tool_calls) {
        if (toolCall.type !== 'function') {
          continue;
        }

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[Chatbot] Executing additional tool: ${functionName}`, functionArgs);

        const mcpAction = await this.executeMCPAction({
          action: functionName,
          data: functionArgs,
        });
        actions.push(mcpAction);

        // Add tool result to conversation history
        this.conversationHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(mcpAction.result || { error: mcpAction.error }),
        });
      }

      // Make another API call to get the final response
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory,
        tools: this.tools.length > 0 ? this.tools : undefined,
        tool_choice: this.tools.length > 0 ? 'auto' : undefined,
        temperature: 1,
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from OpenAI during recursive tool execution');
      }

      console.log('[Chatbot] Recursive post-tool assistant message:', {
        content: assistantMessage.content?.substring(0, 100),
        has_tool_calls: !!assistantMessage.tool_calls?.length,
        finish_reason: completion.choices[0]?.finish_reason
      });

      this.conversationHistory.push(assistantMessage);

      // Check if we need to recurse again
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        return this.continueToolCalling(actions);
      }

      return {
        reply: assistantMessage.content || 'Actions completed successfully.',
        actions,
      };
    }

    // Fallback if no tool calls found
    return {
      reply: 'Actions completed.',
      actions,
    };
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


      case 'createCustomer':
        return await this.mcpClient.createCustomer(action.data as CustomerData);

      case 'list_payment_plans':
        return await this.mcpClient.listPaymentPlans();

      case 'list_checkout_offers':
        return await this.mcpClient.listCheckoutOffers();

      case 'createPayment':
        return await this.mcpClient.createPayment(action.data);

      default:
        return {
          tool: action.action,
          input: action.data,
          error: `Unknown action: ${action.action}`,
        };
    }
  }

  private async generateFollowUpResponse(mcpAction: MCPAction): Promise<string> {
    let resultSummary: string;

    if (mcpAction.error) {
      resultSummary = `Error: ${mcpAction.error}`;
    } else {
      // Extract only relevant information based on the tool type
      switch (mcpAction.tool) {
        case 'createCustomer':
          const customerResult = mcpAction.result;
          if (customerResult?.status === 'success') {
            resultSummary = `Customer created successfully with email: ${customerResult.customer?.email || 'N/A'}`;
          } else {
            resultSummary = `Customer creation failed: ${customerResult?.error || 'Unknown error'}`;
          }
          break;



        case 'list_payment_plans':
        case 'list_checkout_offers':
          // For list operations, provide the full result as it contains data to display
          resultSummary = `Data retrieved successfully: ${JSON.stringify(mcpAction.result, null, 2)}`;
          break;

        case 'createPayment':
          const paymentResult = mcpAction.result;
          if (paymentResult?.status === 'success') {
            resultSummary = `Payment created successfully. Payment ID: ${paymentResult.payment_id || 'N/A'}, Status: ${paymentResult.payment_status || 'N/A'}`;
            if (paymentResult.pix_qr_code_url) {
              resultSummary += `, PIX QR Code available`;
            }
          } else {
            resultSummary = `Payment creation failed: ${paymentResult?.error || 'Unknown error'}`;
          }
          break;

        default:
          // For unknown tools, provide minimal JSON
          resultSummary = `Success: ${JSON.stringify(mcpAction.result, null, 2)}`;
      }
    }

    // Ask OpenAI to generate a friendly response
    this.conversationHistory.push({
      role: 'system',
      content: `The ${mcpAction.tool} action was executed with the following result:\n${resultSummary}\n\nGenerate a friendly, natural response in Brazilian Portuguese to inform the user about the result. Do not include raw JSON in your response. For createCustomer, confirm the customer was created and proceed to the next step.`,
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
