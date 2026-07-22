import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import timecardService from '../services/timecardService';
import { timesheetQueryKeys } from './useTimesheets';
import type { TimecardEntry, TimecardUpdatePayload } from '../types';

export const timecardQueryKeys = {
  all: ['timecards'] as const,
  byTimesheet: (timesheetId: string) => ['timecards', 'timesheet', timesheetId] as const,
  approved: ['timecards', 'approved'] as const,
  rejected: ['timecards', 'rejected'] as const,
  detail: (timecardId: string) => ['timecards', timecardId] as const,
};

export const useApprovedTimecards = () => {
  return useQuery<TimecardEntry[], Error>({
    queryKey: timecardQueryKeys.approved,
    queryFn: timecardService.getApproved,
  });
};

export const useRejectedTimecards = () => {
  return useQuery<TimecardEntry[], Error>({
    queryKey: timecardQueryKeys.rejected,
    queryFn: timecardService.getRejected,
  });
};

export const useExportApprovedTimecards = () => {
  return useMutation<Blob, Error, string>({
    mutationFn: timecardService.exportApproved,
  });
};

export const useTimecard = (timecardId?: string) => {
  return useQuery<TimecardEntry, Error>({
    queryKey: timecardId ? timecardQueryKeys.detail(timecardId) : ['timecards', 'detail'],
    queryFn: () => timecardService.getDetail(timecardId || ''),
    enabled: Boolean(timecardId),
  });
};

export const useApproveTimecard = () => {
  const queryClient = useQueryClient();
  return useMutation<TimecardEntry, Error, string>({
    mutationFn: timecardService.approve,
    onSuccess: (timecard) => {
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.byTimesheet(timecard.timesheet_id) });
    },
  });
};

export const useBulkApproveTimecards = () => {
  const queryClient = useQueryClient();
  return useMutation<TimecardEntry[], Error, string[]>({
    mutationFn: timecardService.bulkApprove,
    onSuccess: (timecards) => {
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.all });
      timecards.forEach((timecard) => {
        queryClient.invalidateQueries({ queryKey: timecardQueryKeys.byTimesheet(timecard.timesheet_id) });
        queryClient.invalidateQueries({ queryKey: timecardQueryKeys.detail(timecard.timecard_id) });
      });
    },
  });
};

export const useBulkRejectTimecards = () => {
  const queryClient = useQueryClient();
  return useMutation<TimecardEntry[], Error, string[]>({
    mutationFn: timecardService.bulkReject,
    onSuccess: (timecards) => {
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.all });
      timecards.forEach((timecard) => {
        queryClient.invalidateQueries({ queryKey: timecardQueryKeys.byTimesheet(timecard.timesheet_id) });
        queryClient.invalidateQueries({ queryKey: timecardQueryKeys.detail(timecard.timecard_id) });
      });
    },
  });
};

export const useRejectTimecard = () => {
  const queryClient = useQueryClient();
  return useMutation<TimecardEntry, Error, string>({
    mutationFn: timecardService.reject,
    onSuccess: (timecard) => {
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.byTimesheet(timecard.timesheet_id) });
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.detail(timecard.timecard_id) });
      queryClient.invalidateQueries({ queryKey: timesheetQueryKeys.underReview });
      queryClient.invalidateQueries({ queryKey: timesheetQueryKeys.processed });
    },
  });
};

export const useResolveTimecard = () => {
  const queryClient = useQueryClient();
  return useMutation<
    TimecardEntry,
    Error,
    { timecardId: string; payload: TimecardUpdatePayload }
  >({
    mutationFn: ({ timecardId, payload }) => timecardService.resolve(timecardId, payload),
    onSuccess: (timecard) => {
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.byTimesheet(timecard.timesheet_id) });
      queryClient.invalidateQueries({ queryKey: timecardQueryKeys.detail(timecard.timecard_id) });
      queryClient.invalidateQueries({ queryKey: timesheetQueryKeys.underReview });
      queryClient.invalidateQueries({ queryKey: timesheetQueryKeys.processed });
    },
  });
};


