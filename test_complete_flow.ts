import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function chat(message: string) {
    try {
        console.log(`\nUser: ${message}`);
        const response = await axios.post(`${BASE_URL}/chat`, { message });
        console.log('Agent:', response.data.reply);
        if (response.data.actions && response.data.actions.length > 0) {
            console.log('Tool Calls:', response.data.actions.map((a: any) => a.tool).join(', '));
        }
        return response.data;
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

async function run() {
    console.log('=== Complete Chatbot Flow Test ===\n');
    console.log('Resetting conversation...');
    await axios.post(`${BASE_URL}/chat/reset`);

    // Step 1: Start conversation
    await chat('Olá! Quero comprar ingressos');

    // Step 2: Provide ALL customer details including CPF
    await chat('Meu nome é Teste Silva, email teste@teste.com, telefone 11999999999, cep 12237-070, CPF 12345678901');

    // Step 3: Ask for payment options (should call list_payment_plans)
    await chat('Quais as formas de pagamento?');

    // Step 4: Choose payment method and confirm purchase
    await chat('Quero 2 ingressos e vou pagar com PIX');
}

run().catch(console.error);
