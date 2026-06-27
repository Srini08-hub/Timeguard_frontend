import axiosInstance from "../../../lib/auth.ts"
import type {ClientResponse, ClientCreate, ClientUpdate} from "../types/index.ts"
import {CLIENT_ENDPOINTS} from "../../../config/constant.ts"

export const clientService = {
  async createClient(client: ClientCreate): Promise<ClientResponse> {
    const response = await axiosInstance.post(CLIENT_ENDPOINTS.CREATE_CLIENT, client)
    return response.data
  },
  
  async updateClient(clientId: string, client: ClientUpdate): Promise<ClientResponse> {
    const response = await axiosInstance.patch(CLIENT_ENDPOINTS.UPDATE_CLIENT(clientId), client)
    return response.data
  },
  
  async deleteClient(clientId: string): Promise<void> {
    await axiosInstance.delete(CLIENT_ENDPOINTS.DELETE_CLIENT(clientId))
  },
  async getClients(): Promise<ClientResponse[]> {
    const response = await axiosInstance.get(CLIENT_ENDPOINTS.GET_CLIENTS)
    return response.data
  },
}
