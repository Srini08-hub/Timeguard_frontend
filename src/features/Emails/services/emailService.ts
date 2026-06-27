import axiosInstance from '../../../lib/auth'
import type { TimesheetEmailResponse,AttachmentInfo } from '../types/index'
import { EMAIL_ENDPOINTS } from '../../../config/constant'


const emailService = {
    getTimesheetEmails: async (): Promise<TimesheetEmailResponse[]> => {
        const response = await axiosInstance.get(EMAIL_ENDPOINTS.GET_TIMESHEET_EMAILS)
        return response.data
    },
    getNonTimesheetEmails: async (): Promise<TimesheetEmailResponse[]> => {
        const response = await axiosInstance.get(EMAIL_ENDPOINTS.GET_NON_TIMESHEET_EMAILS)
        return response.data
    },
    getAttachmentInfo: async (email_id: string): Promise<AttachmentInfo[]> => {
        const response = await axiosInstance.get(EMAIL_ENDPOINTS.GET_ATTACHMENT_INFO(email_id))
        return response.data
    }
}

export default emailService