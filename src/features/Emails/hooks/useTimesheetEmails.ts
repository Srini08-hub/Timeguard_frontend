import { useQuery } from '@tanstack/react-query';
import emailService from '../services/emailService';
import type { TimesheetEmailResponse } from '../types/index';

export const useTimesheetEmails = () => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: ['timesheetEmails'],
    queryFn: emailService.getTimesheetEmails,
    // refetchInterval: 7000, // Check for updates every 5 seconds
  });
};
