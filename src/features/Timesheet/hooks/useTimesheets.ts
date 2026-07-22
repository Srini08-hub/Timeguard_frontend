import { useQuery } from '@tanstack/react-query';

import timesheetService from '../services/timesheetService';
import type { Timesheet } from '../types';

export const timesheetQueryKeys = {
  underReview: ['timesheets', 'under-review'] as const,
  processed: ['timesheets', 'processed'] as const,
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

