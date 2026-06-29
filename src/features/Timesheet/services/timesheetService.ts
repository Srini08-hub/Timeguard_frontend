import axiosInstance from '../../../lib/auth';
import type { Timesheet, ContentExtract } from '../types';
import { TIMESHEET_ENDPOINTS, CONTENT_EXTRACT_ENDPOINTS } from '../../../config/constant';

const timesheetService = {
  getUnderReviewTimesheets: async (): Promise<Timesheet[]> => {
    const response = await axiosInstance.get(TIMESHEET_ENDPOINTS.GET_UNDER_REVIEW_TIMESHEETS);
    return response.data;
  },
  getProcessedTimesheets: async (): Promise<Timesheet[]> => {
    const response = await axiosInstance.get(TIMESHEET_ENDPOINTS.GET_PROCESSED_TIMESHEETS);
    return response.data;
  },
  getContentExtractsByEmailId: async (emailId: string): Promise<ContentExtract[]> => {
    const response = await axiosInstance.get(CONTENT_EXTRACT_ENDPOINTS.GET_CONTENT_EXTRACTS_BY_EMAIL_ID(emailId));
    return response.data;
  },
};

export default timesheetService;
