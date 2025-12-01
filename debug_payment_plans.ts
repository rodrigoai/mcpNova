import { PaymentPlansService } from './src/services/paymentPlansService.js';
import { config } from 'dotenv';

config();

// Mock console.log to capture output if needed, or just rely on stdout
const service = new PaymentPlansService();

// We need to access the private method or just run listPaymentPlans and see logs if enabled
// But listPaymentPlans logs to console if isDevelopment is true.
// So I just need to run it.

async function run() {
    console.log('Fetching payment plans...');
    try {
        const result = await service.listPaymentPlans();
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
