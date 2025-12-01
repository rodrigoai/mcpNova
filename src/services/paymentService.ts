import axios, { AxiosError } from 'axios';
import { config } from 'dotenv';

config();

export interface PaymentProduct {
    id: number;
    quantity: string;
}

export interface PaymentPayload {
    customer_email: string;
    payment_plan_id: string;
    checkout_page_id: string;
    products: PaymentProduct[];
    [key: string]: any; // Allow additional properties
}

export interface PixResponse {
    order_status: string;
    payments: string[];
    pix_qr_code: string;
    pix_qr_code_url: string;
    pix_expires_at: string;
}

export interface PaymentToolResponse {
    payment_id: string;
    status: string;
    pix_qr_code_url: string;
    expires_in: string | { expired: boolean };
}

export class PaymentService {
    private apiUrl: string;
    private isDevelopment: boolean;

    constructor() {
        this.apiUrl = process.env.CUSTOMER_API_HOST ? `${process.env.CUSTOMER_API_HOST}/api/v1` : '';
        if (!this.apiUrl) {
            throw new Error('CUSTOMER_API_HOST environment variable is not set, but is required for PaymentService.');
        }

        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    private log(message: string, data?: any): void {
        if (this.isDevelopment) {
            console.log(`[PaymentService] ${message}`, data || '');
        }
    }

    private calculateExpiresIn(expiresAt: string): string | { expired: boolean } {
        const now = new Date();
        const expiration = new Date(expiresAt);
        const diffMs = expiration.getTime() - now.getTime();

        if (diffMs <= 0) {
            return { expired: true };
        }

        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async createPayment(payload: PaymentPayload): Promise<PaymentToolResponse | { error: string }> {
        try {
            const url = `${this.apiUrl}/payments`;
            this.log('Creating payment with payload:', payload);
            this.log('Request URL:', url);

            // In a real scenario, we might need headers like Authorization.
            // I'll assume for now it's handled or not needed for this specific internal proxy/tool.
            // If it's a direct call to Pagar.me, we'd need a secret key.
            // The user description implies a proxy: "https://{{host}}/api/v1/payments"

            const response = await axios.post<PixResponse>(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization if needed, e.g., Bearer token
                    // 'Authorization': `Bearer ${process.env.API_TOKEN}`
                }
            });

            this.log('Response status:', response.status);
            this.log('Response data:', response.data);

            const data = response.data;

            // Handle PIX response only as requested
            if (data.pix_qr_code_url && data.pix_expires_at) {
                return {
                    payment_id: data.payments[0],
                    status: data.order_status,
                    pix_qr_code_url: data.pix_qr_code_url,
                    expires_in: this.calculateExpiresIn(data.pix_expires_at),
                };
            }

            return {
                error: 'Unexpected response format or non-PIX payment method.',
            };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                this.log('API error:', {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                });

                return {
                    error: axiosError.response?.data
                        ? JSON.stringify(axiosError.response.data)
                        : 'Error creating payment.',
                };
            }

            this.log('Unexpected error:', error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error while creating payment.',
            };
        }
    }
}
