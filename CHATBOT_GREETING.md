# Chatbot Initial Messages & Capabilities

## Updated System Context

The chatbot now has a clear understanding of all three available tools and presents itself accordingly.

### System Prompt Summary

The chatbot knows it can help users with:

- 📋 **Customer registration** (collecting and creating customer records)
- 📍 **Address lookup by CEP** (Brazilian zipcode)
- 💳 **Payment plan information** (credit card installments, PIX, bank slip)

## Example Initial Interactions

### Scenario 1: User asks what the bot can do

**User:** "Olá, como você pode me ajudar?"

**Bot:** "Olá! Posso ajudá-lo com:

- 📋 Cadastro de clientes (registro completo de novos clientes)
- 📍 Consulta de endereços pelo CEP
- 💳 Informações sobre planos de pagamento (parcelamento no cartão, PIX e boleto)

Como posso ajudar você hoje?"

---

### Scenario 2: User asks about a specific capability

**User:** "Vocês trabalham com PIX?"

**Bot:** "Sim! Posso consultar as opções de pagamento disponíveis. Gostaria de saber sobre os planos de pagamento?"

*(If user says yes, bot calls `list_payment_plans` tool)*

---

### Scenario 3: User provides a CEP directly

**User:** "01310-100"

**Bot:** *(recognizes CEP pattern and calls `getAddressByZipcode` tool)*

"O CEP 01310-100 é da Avenida Paulista, no bairro Bela Vista, São Paulo - SP. 

Gostaria de usar esse endereço para cadastrar um cliente?"

---

### Scenario 4: User wants to register a customer

**User:** "Preciso cadastrar um novo cliente"

**Bot:** "Ótimo! Para cadastrar um cliente, preciso das seguintes informações obrigatórias:

- Nome completo
- E-mail
- Telefone

Você também pode fornecer informações opcionais como CEP, CPF, tags, etc. Como deseja prosseguir?"

---

### Scenario 5: User provides all info at once

**User:** "Cadastrar: João Silva, joao@email.com, (11) 98765-4321"

**Bot:** *(recognizes registration intent and calls `createCustomer` tool)*

"Perfeito! Cadastrei João Silva com sucesso. O ID do cliente é #12345."

---

## Testing the Greeting

### Start the chatbot server:

```bash
yarn chatbot:dev
```

### Test greeting interaction:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, o que você pode fazer?",
    "context": {}
  }'
```

### Expected response structure:

```json
{
  "reply": "Olá! Posso ajudá-lo com:\n\n- 📋 Cadastro de clientes...\n- 📍 Consulta de endereços...\n- 💳 Informações sobre planos de pagamento...\n\nComo posso ajudar você hoje?",
  "actions": []
}
```

## Tool Trigger Keywords

The chatbot is trained to recognize these patterns:

### For Payment Plans:
- "pagamento", "pagar", "preço", "valor"
- "parcela", "parcelar", "parcelamento"
- "PIX", "boleto", "cartão"
- "quanto custa", "formas de pagamento"

### For Address Lookup:
- CEP format: "12345-678" or "12345678"
- "endereço", "CEP", "onde fica"
- "rua", "avenida", "bairro"

### For Customer Registration:
- "cadastrar", "registrar", "criar cliente"
- "novo cliente", "adicionar cliente"
- When providing name + email + phone together

## Multi-Language Support

While the bot primarily speaks Brazilian Portuguese, it can understand English queries:

**English Query:** "What payment plans do you offer?"

**Bot Response:** *(in Portuguese)* "Temos as seguintes opções de pagamento..."

## Conversation Flow Examples

### Complete Customer Registration with CEP

1. **User:** "Quero cadastrar um cliente"
2. **Bot:** "Preciso do nome, e-mail e telefone"
3. **User:** "Maria Santos, maria@email.com, (21) 99999-8888, CEP 20040-020"
4. **Bot:** *(calls getAddressByZipcode)* "Encontrei o endereço: Avenida Rio Branco, Centro, Rio de Janeiro - RJ"
5. **Bot:** *(calls createCustomer)* "Cliente cadastrado com sucesso! ID: #12345"

### Payment Inquiry Leading to Registration

1. **User:** "Quanto custa?"
2. **Bot:** *(calls list_payment_plans)* "Temos parcelamento em até 12x de R$ 91,33 ou à vista por R$ 1.096,00"
3. **User:** "Quero comprar, como faço?"
4. **Bot:** "Ótimo! Vou precisar cadastrar seus dados. Qual é o seu nome completo?"
5. *(continues registration flow)*

## Customizing the Tone

The chatbot's personality can be adjusted via environment variables:

```env
# Professional (default)
AGENT_TONE=Professional, helpful, and efficient

# Friendly
AGENT_TONE=Warm, friendly, and conversational

# Enthusiastic
AGENT_TONE=Encouraging, visionary, witty

# Concise
AGENT_TONE=Direct, concise, and objective
```

This affects how the bot presents information but doesn't change which tools it can use.

## Summary

✅ Chatbot now clearly communicates all 3 capabilities
✅ Users can discover features by asking "what can you do?"
✅ Bot automatically detects intent and calls appropriate tools
✅ All responses are in Brazilian Portuguese
✅ System prompt is concise and clear about available tools
