import { useQuery } from '@tanstack/react-query';
import emailService from '../services/emailService';
import type { TimesheetEmailResponse } from '../types/index';

export const useNonTimesheetEmails = () => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: ['nonTimesheetEmails'],
    queryFn: emailService.getNonTimesheetEmails,
    // refetchInterval: 7000, // Check for updates every 5 seconds
  });
};
