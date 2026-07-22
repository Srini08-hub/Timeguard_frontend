import axiosInstance from '../../../lib/auth';
import type { Timesheet } from '../types';
import { TIMESHEET_ENDPOINTS } from '../../../config/constant';

const timesheetService = {
  getUnderReviewTimesheets: async (): Promise<Timesheet[]> => {
    const response = await axiosInstance.get(TIMESHEET_ENDPOINTS.GET_UNDER_REVIEW_TIMESHEETS);
    return response.data;
  },
  getProcessedTimesheets: async (): Promise<Timesheet[]> => {
    const response = await axiosInstance.get(TIMESHEET_ENDPOINTS.GET_PROCESSED_TIMESHEETS);
    return response.data;
  },
};

export default timesheetService;
