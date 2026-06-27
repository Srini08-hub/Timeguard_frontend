import { useQuery } from '@tanstack/react-query';

import emailService from '../services/emailService';
import type { EmailStatus, TimesheetEmailResponse } from '../types';

export type MailCategory = 'timesheet' | 'non-timesheet';

export const emailQueryKeys = {
  all: ['emails'] as const,
  byStatus: (status: EmailStatus) => ['emails', 'status', status] as const,
  timesheet: ['emails', 'timesheet'] as const,
  nonTimesheet: ['emails', 'non-timesheet'] as const,
};

export const mailStatuses = [
  'received',
  'classified',
  'extracted',
  'merged',
  'processed',
  'failed',
] as const satisfies readonly EmailStatus[];

export const categoryStatuses = [
  'classified',
  // 'extracted',
  // 'merged',
  // 'processed',
] as const satisfies readonly EmailStatus[];

export const canFilterByMailCategory = (status: EmailStatus) => {
  return (categoryStatuses as readonly EmailStatus[]).includes(status);
};

export const useEmailsByStatus = (status: EmailStatus, enabled = true) => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: emailQueryKeys.byStatus(status),
    queryFn: () => emailService.getEmailsByStatus(status),
    enabled,
  });
};

export const useTimesheetMails = (enabled = true) => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: emailQueryKeys.timesheet,
    queryFn: emailService.getTimesheetEmails,
    enabled,
  });
};

export const useNonTimesheetMails = (enabled = true) => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: emailQueryKeys.nonTimesheet,
    queryFn: emailService.getNonTimesheetEmails,
    enabled,
  });
};
