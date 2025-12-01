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
    console.log('=== Testing createPayment Integration ===\n');
    console.log('Resetting conversation...');
    await axios.post(`${BASE_URL}/chat/reset`);

    // Step 1: Start and provide all info upfront
    await chat('Quero comprar 2 ingressos. Meu nome é Test User, email test@example.com, telefone 11999999999, cep 12237-070');

    // Step 2: Select payment method
    await chat('Quero pagar com PIX');

    // Step 3: Confirm purchase - this should trigger createPayment
    await chat('Confirmo a compra');
}

run();
