import axios, { AxiosError } from 'axios';

export interface Offer {
    name: string;
    description: string;
    value: number;
    image: string;
}

export interface CheckoutProduct {
    type: string;
    id: number;
    name: string;
    description: string;
    value: number;
    image: string;
}

export interface CheckoutPageResponse {
    products: CheckoutProduct[];
    order_bump_products: CheckoutProduct[];
}

export class CheckoutService {
    private apiHost: string;
    private apiToken: string;
    private checkoutId: string;
    private isDevelopment: boolean;

    constructor() {
        this.apiHost = process.env.CUSTOMER_API_HOST || '';
        this.apiToken = process.env.CUSTOMER_API_TOKEN || '';
        this.checkoutId = process.env.CHECKOUT_ID || '';
        this.isDevelopment = process.env.NODE_ENV === 'development';

        if (!this.apiHost || !this.apiToken) {
            throw new Error('Missing required environment variables: CUSTOMER_API_HOST or CUSTOMER_API_TOKEN');
        }

        if (!this.checkoutId) {
            throw new Error('Missing required environment variable: CHECKOUT_ID');
        }
    }

    private log(message: string, data?: any): void {
        if (this.isDevelopment) {
            console.log(`[CheckoutService] ${message}`, data || '');
        }
    }

    private async resolveRedirect(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400,
            });

            if (response.status === 302 || response.status === 301) {
                const location = response.headers.location;
                if (location) {
                    return location;
                }
            }
            return url;
        } catch (error) {
            // If error (e.g. network error), return original URL
            this.log('Error resolving redirect for URL:', url);
            return url;
        }
    }

    async listCheckoutOffers(): Promise<Offer[]> {
        const url = `${this.apiHost}/api/v1/checkout_pages/${this.checkoutId}`;

        try {
            this.log('Making GET request to:', url);

            const response = await axios.get<CheckoutPageResponse>(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });

            this.log('Response status:', response.status);
            // this.log('Response data:', JSON.stringify(response.data, null, 2));

            const offers = await Promise.all(response.data.products
                .filter((product) => product.type === 'offer')
                .map(async (product) => {
                    const initialUrl = product.image.startsWith('http') ? product.image : `${this.apiHost}${product.image}`;
                    const finalUrl = await this.resolveRedirect(initialUrl);

                    return {
                        name: product.name,
                        description: product.description,
                        value: product.value,
                        image: finalUrl,
                    };
                }));

            return offers;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                this.log('API error:', {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                });
                throw new Error(`Failed to fetch checkout offers: ${axiosError.message}`);
            }

            this.log('Unexpected error:', error);
            throw error;
        }
    }
}
