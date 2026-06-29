import { useQueries, useQuery } from '@tanstack/react-query';

import emailService from '../services/emailService';
import type { EmailStatus, TimesheetEmailResponse } from '../types';

export type MailCategory = 'timesheet' | 'non-timesheet';
export type MailFilter = 'all' | 'timesheet' | 'non-timesheet';

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
] as const satisfies readonly EmailStatus[];

export const canFilterByMailCategory = (status: EmailStatus) => {
  return (categoryStatuses as readonly EmailStatus[]).includes(status);
};

const dedupeEmails = (emails: TimesheetEmailResponse[]) => {
  const byId = new Map<string, TimesheetEmailResponse>();
  emails.forEach((email) => {
    byId.set(email.email_id, email);
  });
  return Array.from(byId.values());
};

export const useAllMails = (enabled = true, refetchInterval?: number) => {
  const results = useQueries({
    queries: mailStatuses.map((status) => ({
      queryKey: emailQueryKeys.byStatus(status),
      queryFn: () => emailService.getEmailsByStatus(status),
      enabled,
      refetchInterval,
    })),
  });

  const data = dedupeEmails(results.flatMap((result) => result.data ?? []));
  const error = results.find((result) => result.error)?.error as Error | undefined;
  const isLoading = results.some((result) => result.isLoading);
  const isRefetching = results.some((result) => result.isRefetching);
  const refetch = () => Promise.all(results.map((result) => result.refetch()));

  return {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  };
};

export const useEmailsByStatus = (status: EmailStatus, enabled = true, refetchInterval?: number) => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: emailQueryKeys.byStatus(status),
    queryFn: () => emailService.getEmailsByStatus(status),
    enabled,
    refetchInterval,
  });
};

export const useTimesheetMails = (enabled = true, refetchInterval?: number) => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: emailQueryKeys.timesheet,
    queryFn: emailService.getTimesheetEmails,
    enabled,
    refetchInterval,
  });
};

export const useNonTimesheetMails = (enabled = true, refetchInterval?: number) => {
  return useQuery<TimesheetEmailResponse[], Error>({
    queryKey: emailQueryKeys.nonTimesheet,
    queryFn: emailService.getNonTimesheetEmails,
    enabled,
    refetchInterval,
  });
};
