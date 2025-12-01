import axios, { AxiosError } from 'axios';

export interface PaymentPlanConfig {
  checkout_id: string;
  product_id: string;
}

export interface InstallmentOption {
  id: string;
  installments: number;
  value: number;
}

export interface SinglePaymentOption {
  id: string;
  value: number;
}

export interface PaymentPlans {
  credit_card: InstallmentOption[];
  pix: SinglePaymentOption[];
  bank_slip: SinglePaymentOption[];
}

export interface PaymentPlansResponse {
  checkout_id: string;
  product_id: string;
  plans: PaymentPlans;
  payment_summary: string;
}

export interface PaymentPlansErrorResponse {
  error: string;
  statusCode?: number;
}

interface ApiPaymentCondition {
  id?: string;
  number?: number; // Number of installments (maps to installments in our response)
  value: number;
  fine?: number;
  fine_tax?: number;
  late_interest?: number;
}

interface ApiResponse {
  credit_card?: ApiPaymentCondition[];
  pix?: ApiPaymentCondition[];
  bank_slip?: ApiPaymentCondition[];
}

export class PaymentPlansService {
  private apiHost: string;
  private apiToken: string;
  private isDevelopment: boolean;
  private checkoutId: string;
  private productId: string;

  constructor() {
    this.apiHost = process.env.CUSTOMER_API_HOST || '';
    this.apiToken = process.env.CUSTOMER_API_TOKEN || '';
    this.checkoutId = process.env.CHECKOUT_ID || '';
    this.productId = process.env.PRODUCT_ID || '';
    this.isDevelopment = process.env.NODE_ENV === 'development';

    if (!this.apiHost || !this.apiToken) {
      throw new Error('Missing required environment variables: CUSTOMER_API_HOST or CUSTOMER_API_TOKEN');
    }

    if (!this.checkoutId || !this.productId) {
      throw new Error('Missing required environment variables: CHECKOUT_ID or PRODUCT_ID');
    }
  }

  private log(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[PaymentPlansService] ${message}`, data || '');
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private generateSummary(plans: PaymentPlans): string {
    const parts: string[] = [];

    // Credit card installments
    if (plans.credit_card.length > 0) {
      const maxInstallment = plans.credit_card[plans.credit_card.length - 1];
      parts.push(
        `até ${maxInstallment.installments}x de ${this.formatCurrency(maxInstallment.value)} no cartão de crédito`
      );
    }

    // Single payment options
    const singlePaymentParts: string[] = [];
    if (plans.pix.length > 0) {
      singlePaymentParts.push(`PIX por ${this.formatCurrency(plans.pix[0].value)}`);
    }
    if (plans.bank_slip.length > 0) {
      singlePaymentParts.push(`boleto por ${this.formatCurrency(plans.bank_slip[0].value)}`);
    }

    if (singlePaymentParts.length > 0) {
      parts.push(`à vista no ${singlePaymentParts.join(' ou ')}`);
    }

    if (parts.length === 0) {
      return 'Nenhuma opção de pagamento disponível.';
    }

    return `Temos pagamentos em ${parts.join(', ou ')}.`;
  }

  async listPaymentPlans(): Promise<PaymentPlansResponse | PaymentPlansErrorResponse> {
    const url = `${this.apiHost}/api/v1/payment_plans`;

    try {
      this.log('Making GET request to:', url);
      this.log('Query parameters:', {
        product_id: this.productId,
        checkout_page_id: this.checkoutId,
      });

      const response = await axios.get<ApiResponse>(url, {
        params: {
          product_id: this.productId,
          checkout_page_id: this.checkoutId,
        },
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.log('Response status:', response.status);
      this.log('Response data:', response.data);

      // Process the API response
      const plans: PaymentPlans = {
        credit_card: [],
        pix: [],
        bank_slip: [],
      };

      // Extract credit card installments (map API's 'number' to 'installments', ignore fine, fine_tax, late_interest)
      if (response.data.credit_card && Array.isArray(response.data.credit_card)) {
        plans.credit_card = response.data.credit_card.map((item) => ({
          id: item.id || '',
          installments: item.number || 1, // API returns 'number', we map it to 'installments'
          value: item.value,
        }));
      }

      // Extract pix single payment
      if (response.data.pix && Array.isArray(response.data.pix)) {
        plans.pix = response.data.pix.map((item) => ({
          id: item.id || '',
          value: item.value,
        }));
      }

      // Extract bank slip single payment
      if (response.data.bank_slip && Array.isArray(response.data.bank_slip)) {
        plans.bank_slip = response.data.bank_slip.map((item) => ({
          id: item.id || '',
          value: item.value,
        }));
      }

      // Generate human-friendly summary
      const payment_summary = this.generateSummary(plans);

      return {
        checkout_id: this.checkoutId,
        product_id: this.productId,
        plans,
        payment_summary,
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
            : axiosError.message,
          statusCode: axiosError.response?.status,
        };
      }

      this.log('Unexpected error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  getConfig(): PaymentPlanConfig {
    return {
      checkout_id: this.checkoutId,
      product_id: this.productId,
    };
  }
}
