import axios from 'axios';
import { TIMECARD_ENDPOINTS } from '../../../config/constant';
import axiosInstance from '../../../lib/auth';
import type { TimecardEntry, TimecardUpdatePayload } from '../types';

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

  return 'Timecard operation failed';
};

const timecardService = {
  getByTimesheet: async (timesheetId: string): Promise<TimecardEntry[]> => {
    try {
      const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_BY_TIMESHEET(timesheetId));
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getDetail: async (timecardId: string): Promise<TimecardEntry> => {
    try {
      const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_DETAIL(timecardId));
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getApproved: async (): Promise<TimecardEntry[]> => {
    try {
      const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_APPROVED);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getRejected: async (): Promise<TimecardEntry[]> => {
    try {
      const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_REJECTED);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  exportApproved: async (weekEnding: string): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(TIMECARD_ENDPOINTS.EXPORT_APPROVED(weekEnding), {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  resolve: async (
    timecardId: string,
    payload: TimecardUpdatePayload,
  ): Promise<TimecardEntry> => {
    try {
      const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.RESOLVE(timecardId), payload);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  approve: async (timecardId: string): Promise<TimecardEntry> => {
    try {
      const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.APPROVE(timecardId));
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  bulkApprove: async (timecardIds: string[]): Promise<TimecardEntry[]> => {
    try {
      const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.BULK_APPROVE, {
        timecard_ids: timecardIds,
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  bulkReject: async (timecardIds: string[]): Promise<TimecardEntry[]> => {
    try {
      const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.BULK_REJECT, {
        timecard_ids: timecardIds,
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  reject: async (timecardId: string): Promise<TimecardEntry> => {
    try {
      const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.REJECT(timecardId));
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};

export default timecardService;
