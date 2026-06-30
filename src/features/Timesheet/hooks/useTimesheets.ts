import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import timesheetService from '../services/timesheetService';
import type { ContentExtract, Timesheet } from '../types';

export const timesheetQueryKeys = {
  underReview: ['timesheets', 'under-review'] as const,
  processed: ['timesheets', 'processed'] as const,
  contentExtracts: (emailId: string) => ['timesheets', 'content-extracts', emailId] as const,
};

export const useUnderReviewTimesheets = () => {
  return useQuery<Timesheet[], Error>({
    queryKey: timesheetQueryKeys.underReview,
    queryFn: timesheetService.getUnderReviewTimesheets,
  });
};

export const useProcessedTimesheets = () => {
  return useQuery<Timesheet[], Error>({
    queryKey: timesheetQueryKeys.processed,
    queryFn: timesheetService.getProcessedTimesheets,
  });
};

export const useMarkTimesheetProcessed = () => {
  const queryClient = useQueryClient();

  return useMutation<Timesheet, Error, string>({
    mutationFn: timesheetService.markProcessed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timesheetQueryKeys.underReview });
      queryClient.invalidateQueries({ queryKey: timesheetQueryKeys.processed });
    },
  });
};

export const useTimesheetContentExtracts = (emailId?: string) => {
  return useQuery<ContentExtract[], Error>({
    queryKey: emailId ? timesheetQueryKeys.contentExtracts(emailId) : ['timesheets', 'content-extracts'],
    queryFn: () => timesheetService.getContentExtractsByEmailId(emailId ?? ''),
    enabled: Boolean(emailId),
  });
};
