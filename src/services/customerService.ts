import axios, { AxiosError } from 'axios';

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  retention?: boolean;
  identification?: string;
  zipcode?: string;
  state?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  list_ids?: number;
  create_deal?: boolean;
  tags?: string;
  url?: string;
  utm_term?: string;
  utm_medium?: string;
  utm_source?: string;
  utm_campaign?: string;
  company_id?: string;
  utm_content?: string;
}

export interface CustomerResponse {
  status: string;
  customerId?: number;
  data?: any;
  error?: string;
  statusCode?: number;
}

export class CustomerService {
  private apiHost: string;
  private apiToken: string;
  private isDevelopment: boolean;

  constructor() {
    this.apiHost = process.env.CUSTOMER_API_HOST || '';
    this.apiToken = process.env.CUSTOMER_API_TOKEN || '';
    this.isDevelopment = process.env.NODE_ENV === 'development';

    if (!this.apiHost || !this.apiToken) {
      throw new Error('Missing required environment variables: CUSTOMER_API_HOST or CUSTOMER_API_TOKEN');
    }
  }

  private log(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[CustomerService] ${message}`, data || '');
    }
  }

  async createCustomer(customerData: CustomerData): Promise<CustomerResponse> {
    const url = `${this.apiHost}/api/v1/customers`;

    try {
      this.log('Making POST request to:', url);
      this.log('Request payload:', customerData);

      const response = await axios.post(url, customerData, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.log('Response status:', response.status);
      this.log('Response data:', response.data);

      return {
        status: 'success',
        customerId: response.data.id || response.data.customerId,
        data: response.data,
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
          status: 'error',
          error: axiosError.response?.data 
            ? JSON.stringify(axiosError.response.data)
            : axiosError.message,
          statusCode: axiosError.response?.status,
        };
      }

      this.log('Unexpected error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  validateRequiredFields(data: Partial<CustomerData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name) {
      errors.push('name is required');
    }

    if (!data.email) {
      errors.push('email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('email format is invalid');
    }

    if (!data.phone) {
      errors.push('phone is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
