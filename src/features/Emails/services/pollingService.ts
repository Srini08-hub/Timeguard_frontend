import axiosInstance from '../../../lib/auth';
import { POLLING_ENDPOINTS } from '../../../config/constant';

export interface PollingStatusResponse {
  running: boolean;
  interval_seconds: number | null;
}

const pollingService = {
  getPollingStatus: async (): Promise<PollingStatusResponse> => {
    const response = await axiosInstance.get(POLLING_ENDPOINTS.GET_STATUS);
    return response.data;
  },
  startPolling: async (intervalSeconds: number): Promise<PollingStatusResponse> => {
    const response = await axiosInstance.post(POLLING_ENDPOINTS.START, {
      interval_seconds: intervalSeconds,
    });
    return response.data;
  },
  stopPolling: async (): Promise<PollingStatusResponse> => {
    const response = await axiosInstance.post(POLLING_ENDPOINTS.STOP);
    return response.data;
  },
};

export default pollingService;