# Chatbot Payment Plans Integration Test

## Overview

The `list_payment_plans` tool has been successfully integrated into the chatbot service. The chatbot can now retrieve and present payment plan information when users ask about pricing, payment options, or installments.

## What Was Updated

### 1. MCP Client (`src/services/mcpClient.ts`)
- ✅ Added `listPaymentPlans()` method
- ✅ Handles MCP tool call to `list_payment_plans`
- ✅ Parses and returns payment plan data

### 2. Chatbot Service (`src/services/chatbotService.ts`)
- ✅ Updated system prompt to include payment plans tool
- ✅ Added instructions for when to use the tool
- ✅ Added `list_payment_plans` case in `executeMCPAction()`
- ✅ Chatbot will automatically call the tool when users ask about payments

## How It Works

1. **User asks about payment options** (e.g., "Quais são as formas de pagamento?")
2. **OpenAI GPT analyzes** the request and determines payment info is needed
3. **LLM responds with action**:
   ```json
   {
     "action": "list_payment_plans",
     "data": {}
   }
   ```
4. **Chatbot executes** the MCP tool via `mcpClient.listPaymentPlans()`
5. **MCP server fetches** payment plans from the API
6. **Result is returned** with credit card, PIX, and bank slip options
7. **LLM generates** a friendly Portuguese response with the payment information

## Testing the Integration

### Step 1: Start the Chatbot Server

```bash
cd /Users/rcslima/projects/mcpNova

# Development mode
yarn chatbot:dev

# OR Production mode
yarn build
yarn chatbot:start
```

The server will start on port 3000 (or your configured `CHATBOT_PORT`).

### Step 2: Test Payment Plans Queries

#### Test 1: Direct Payment Question
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quais são as formas de pagamento disponíveis?",
    "context": {}
  }'
```

**Expected Response:**
```json
{
  "reply": "Temos pagamentos em até 12x de R$ 91,33 no cartão de crédito, ou à vista no PIX por R$ 1.096,00 ou boleto por R$ 1.096,00.",
  "actions": [
    {
      "tool": "list_payment_plans",
      "input": {},
      "result": {
        "checkout_id": "...",
        "product_id": "36,42",
        "plans": {
          "credit_card": [...],
          "pix": [...],
          "bank_slip": [...]
        },
        "payment_summary": "..."
      }
    }
  ]
}
```

#### Test 2: Installment Question
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Posso parcelar em quantas vezes?",
    "context": {}
  }'
```

#### Test 3: Pricing Question
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual é o preço?",
    "context": {}
  }'
```

#### Test 4: PIX Payment Question
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Aceita PIX?",
    "context": {}
  }'
```

### Step 3: Verify MCP Tool Registration

```bash
# The chatbot logs should show:
# [MCP Client] Available tools: [ 'createCustomer', 'getAddressByZipcode', 'list_payment_plans' ]
```

## Example Conversation Flow

**User:** "Oi, quero saber as opções de pagamento"

**Bot:** "Claro! Deixe-me consultar as opções disponíveis..."

*(Bot calls `list_payment_plans` tool)*

**Bot:** "Temos as seguintes opções de pagamento:
- Cartão de crédito: até 12x de R$ 91,33
- PIX à vista: R$ 1.096,00
- Boleto à vista: R$ 1.096,00

Qual forma de pagamento você prefere?"

## Debugging

### Enable Development Logging

Set `NODE_ENV=development` in your `.env` file to see detailed logs:

```env
NODE_ENV=development
```

You'll see logs like:
```
[MCP Client] Fetching payment plans
[MCP Client] Raw result: {...}
[MCP Client] Parsed result: {...}
[PaymentPlansService] Making GET request to: https://...
[PaymentPlansService] Response status: 200
```

### Check MCP Server Configuration

Verify your environment variables are set:
```bash
# .env file must have:
CHECKOUT_ID=your_actual_checkout_id
PRODUCT_ID=36,42
CUSTOMER_API_HOST=https://coyo.staging.pay.nova.money
CUSTOMER_API_TOKEN=your_token
```

### Test MCP Server Directly

You can test the MCP server standalone to verify the tool works:
```bash
yarn dev
# Then use an MCP client to call list_payment_plans
```

## Troubleshooting

### Issue: "Unknown action: list_payment_plans"
**Solution:** Rebuild the project: `yarn build`

### Issue: "Missing required environment variables: CHECKOUT_ID or PRODUCT_ID"
**Solution:** Add `CHECKOUT_ID` and `PRODUCT_ID` to your `.env` file

### Issue: Bot doesn't call the tool
**Solution:** 
- Check if the question is clear about payment/pricing
- Try more explicit questions like "mostrar planos de pagamento"
- Reset conversation: `POST /api/chat/reset`

### Issue: API returns 401 error
**Solution:** Verify `CUSTOMER_API_TOKEN` is valid and has access to payment plans endpoint

## System Prompt Trigger Words

The chatbot is configured to recognize these Portuguese terms and call `list_payment_plans`:

- "formas de pagamento"
- "opções de pagamento"
- "planos de pagamento"
- "parcelamento"
- "parcelas"
- "preço"
- "valor"
- "PIX"
- "boleto"
- "cartão de crédito"
- "installments" (English queries)
- "payment plans" (English queries)

## Next Steps

1. ✅ Integration complete
2. ✅ Build successful
3. 🔄 Test with your actual `CHECKOUT_ID`
4. 🔄 Verify API response with real data
5. 🔄 Test chatbot responses in Portuguese
6. 🔄 Monitor chatbot logs for any errors

## Files Modified

- ✅ `src/services/mcpClient.ts` - Added `listPaymentPlans()` method
- ✅ `src/services/chatbotService.ts` - Updated system prompt and action handler
- ✅ Build verified: All TypeScript compiles successfully
