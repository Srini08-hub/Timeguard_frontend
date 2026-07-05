import axios from 'axios';
import axiosInstance from '../../../lib/auth.ts';
import type { ClientResponse, ClientCreate, ClientUpdate } from '../types/index.ts';
import { CLIENT_ENDPOINTS } from '../../../config/constant.ts';

const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as {
      detail?: string;
      error_type?: string;
      message?: string;
    } | undefined;

    const detail = responseData?.detail ?? responseData?.message;
    if (detail) {
      return responseData?.error_type ? `${responseData.error_type}: ${detail}` : detail;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Client operation failed';
};

export const clientService = {
  async createClient(client: ClientCreate): Promise<ClientResponse> {
    try {
      const response = await axiosInstance.post(CLIENT_ENDPOINTS.CREATE_CLIENT, client)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },
  
  async updateClient(clientId: string, client: ClientUpdate): Promise<ClientResponse> {
    try {
      const response = await axiosInstance.patch(CLIENT_ENDPOINTS.UPDATE_CLIENT(clientId), client)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },
  
  async deleteClient(clientId: string): Promise<void> {
    try {
      await axiosInstance.delete(CLIENT_ENDPOINTS.DELETE_CLIENT(clientId))
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },
  async getClients(): Promise<ClientResponse[]> {
    try {
      const response = await axiosInstance.get(CLIENT_ENDPOINTS.GET_CLIENTS)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },
}
