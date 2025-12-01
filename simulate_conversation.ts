import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function chat(message: string) {
    try {
        console.log(`\nUser: ${message}`);
        const response = await axios.post(`${BASE_URL}/chat`, { message });
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        console.log('Agent:', response.data.message);
        if (response.data.toolCalls) {
            console.log('Tool Calls:', JSON.stringify(response.data.toolCalls, null, 2));
        }
        return response.data;
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

async function run() {
    console.log('Resetting conversation...');
    await axios.post(`${BASE_URL}/chat/reset`);

    // Step 1: Start conversation
    await chat('Quero comprar ingressos');

    // Step 2: Provide details if asked (simulating a flow where user provides info)
    // The agent might ask for name/email first.
    // I'll just provide them proactively to speed up.
    await chat('Meu nome é Teste, email teste@teste.com, telefone 11999999999, cep 12237-070');

    // Step 3: Ask for payment methods
    await chat('Quais as formas de pagamento?');

    // Step 4: Select PIX and quantity
    await chat('Vou querer 2 ingressos no PIX');
}

run();
