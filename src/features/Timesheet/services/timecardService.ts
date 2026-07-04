import { TIMECARD_ENDPOINTS } from '../../../config/constant';
import axiosInstance from '../../../lib/auth';
import type { TimecardEntry, TimecardUpdatePayload } from '../types';

const timecardService = {
  getByTimesheet: async (timesheetId: string): Promise<TimecardEntry[]> => {
    const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_BY_TIMESHEET(timesheetId));
    return response.data;
  },

  getDetail: async (timecardId: string): Promise<TimecardEntry> => {
    const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_DETAIL(timecardId));
    return response.data;
  },

  getApproved: async (): Promise<TimecardEntry[]> => {
    const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_APPROVED);
    return response.data;
  },

  getRejected: async (): Promise<TimecardEntry[]> => {
    const response = await axiosInstance.get(TIMECARD_ENDPOINTS.GET_REJECTED);
    return response.data;
  },

  exportApproved: async (weekEnding: string): Promise<Blob> => {
    const response = await axiosInstance.get(TIMECARD_ENDPOINTS.EXPORT_APPROVED(weekEnding), {
      responseType: 'blob',
    });
    return response.data;
  },

  resolve: async (
    timecardId: string,
    payload: TimecardUpdatePayload,
  ): Promise<TimecardEntry> => {
    const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.RESOLVE(timecardId), payload);
    return response.data;
  },

  approve: async (timecardId: string): Promise<TimecardEntry> => {
    const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.APPROVE(timecardId));
    return response.data;
  },

  bulkApprove: async (timecardIds: string[]): Promise<TimecardEntry[]> => {
    const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.BULK_APPROVE, {
      timecard_ids: timecardIds,
    });
    return response.data;
  },

  bulkReject: async (timecardIds: string[]): Promise<TimecardEntry[]> => {
    const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.BULK_REJECT, {
      timecard_ids: timecardIds,
    });
    return response.data;
  },

  reject: async (timecardId: string): Promise<TimecardEntry> => {
    const response = await axiosInstance.patch(TIMECARD_ENDPOINTS.REJECT(timecardId));
    return response.data;
  },
};

export default timecardService;

