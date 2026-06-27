import { useQuery } from '@tanstack/react-query';

import timesheetService from '../services/timesheetService';
import type { Timesheet } from '../types';

export const usePendingTimesheets = () => {
  return useQuery<Timesheet[], Error>({
    queryKey: ['pendingTimesheets'],
    queryFn: timesheetService.getPendingTimesheets,
  });
};
