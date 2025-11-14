import axios, { AxiosError } from 'axios';

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface AddressLookupResponse {
  status: string;
  address?: ViaCepAddress;
  error?: string;
}

export class ViaCepService {
  private apiUrl = 'https://viacep.com.br/ws';
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private log(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[ViaCepService] ${message}`, data || '');
    }
  }

  /**
   * Lookup address by Brazilian zipcode (CEP)
   * @param zipcode - CEP in format XXXXX-XXX or XXXXXXXX
   * @returns Address information or error
   */
  async getAddressByZipcode(zipcode: string): Promise<AddressLookupResponse> {
    // Clean zipcode - remove non-numeric characters
    const cleanZipcode = zipcode.replace(/\D/g, '');

    // Validate zipcode format (8 digits)
    if (cleanZipcode.length !== 8) {
      return {
        status: 'error',
        error: 'Invalid CEP. Must contain 8 digits.',
      };
    }

    const url = `${this.apiUrl}/${cleanZipcode}/json`;

    try {
      this.log('Fetching address for CEP:', cleanZipcode);
      this.log('Request URL:', url);

      const response = await axios.get<ViaCepAddress | { erro: boolean }>(url, {
        timeout: 5000,
      });

      this.log('Response status:', response.status);
      this.log('Response data:', response.data);

      // ViaCEP returns { erro: true } for invalid CEP
      if ('erro' in response.data && response.data.erro) {
        return {
          status: 'error',
          error: 'CEP not found.',
        };
      }

      return {
        status: 'success',
        address: response.data as ViaCepAddress,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.log('API error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        if (axiosError.code === 'ECONNABORTED') {
          return {
            status: 'error',
            error: 'Timeout while fetching CEP. Try again.',
          };
        }

        return {
          status: 'error',
          error: axiosError.response?.data 
            ? JSON.stringify(axiosError.response.data)
            : 'Error fetching CEP.',
        };
      }

      this.log('Unexpected error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error while fetching CEP.',
      };
    }
  }

  /**
   * Convert ViaCEP address to customer address format
   */
  convertToCustomerAddress(viaCepAddress: ViaCepAddress) {
    return {
      zipcode: viaCepAddress.cep,
      street: viaCepAddress.logradouro,
      neighborhood: viaCepAddress.bairro,
      city: viaCepAddress.localidade,
      state: viaCepAddress.uf,
    };
  }
}
