import axiosInstance from '../../../lib/auth'
import type { AuthResponse, LoginCredentials, UserInfo } from '../types'
import { AUTH_ENDPOINTS } from '../../../config/constant'


const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, credentials)
    return response.data
  },
  refresh: async (): Promise<void> => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.REFRESH)
    return response.data
  },
  logout: async (): Promise<void> => {
    await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT)
  },
  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await axiosInstance.get(AUTH_ENDPOINTS.USER_ME)
    return response.data
  },
}

export default authService