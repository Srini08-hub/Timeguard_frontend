import axiosInstance from '../../../lib/auth'
import type { Timesheet } from '../types/index'
import { TIMESHEET_ENDPOINTS } from '../../../config/constant'

const timesheetService = {
    getPendingTimesheets: async (): Promise<Timesheet[]> => {
        const response = await axiosInstance.get(TIMESHEET_ENDPOINTS.GET_PENDING_TIMESHEETS)
        return response.data
    }
}
export default timesheetService