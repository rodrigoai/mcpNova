
import { MCPClient } from './src/services/mcpClient.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCreateCustomer() {
    const mcpServerPath = path.resolve(__dirname, 'build/index.js');
    const client = new MCPClient(mcpServerPath);

    try {
        await client.initialize();
        console.log('MCP Client initialized');

        const customerData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '11999999999',
            zipcode: '01001000', // Praça da Sé, São Paulo
        };

        console.log('Calling createCustomer with:', customerData);
        const result = await client.createCustomer(customerData);
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.shutdown();
    }
}

testCreateCustomer();
