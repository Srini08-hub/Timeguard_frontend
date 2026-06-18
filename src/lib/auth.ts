import axios from 'axios'
import { ENV } from '../config/env'

const axiosInstance = axios.create({
    baseURL: ENV.API_URL,
    withCredentials: true, // send cookies automatically
    headers: {
        'Content-Type': 'application/json',
    },
})


let refreshPromise: Promise<any> | null = null

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const message = error.response?.data?.detail ?? error.response?.data?.message
    if (
      
      error.response?.status === 401 &&
      (message === 'Token expired' || message === 'Access token is missing') &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = axiosInstance.post('/auth/refresh')
        }

        await refreshPromise

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      } finally {
        refreshPromise = null
      }
    }

    return Promise.reject(error)
  }
)
export default axiosInstance