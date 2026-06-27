
import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Inbox,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { usePendingTimesheets } from '../hooks/usePendingTimesheets';
import type { Timesheet } from '../types/index';
const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'processed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
};

const formatDate = (value: string | null) => {
  if (!value) return 'Not set';

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const TimesheetPending: React.FC = () => {
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(
    null,
  );

  const {
    data: timesheets = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = usePendingTimesheets();

  const extractedPayload = useMemo(() => {
    if (!selectedTimesheet?.extracted_payload) {
      return 'No extracted data available for this timesheet.';
    }

    return JSON.stringify(selectedTimesheet.extracted_payload, null, 2);
  }, [selectedTimesheet]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Pending Timesheets
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Review timesheets waiting for extraction or approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRefetching && (
            <span className="text-xs font-medium text-blue-600 animate-pulse dark:text-blue-400">
              Syncing...
            </span>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-750 shadow-2xs transition-all hover:bg-gray-50 hover:shadow-xs disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50"
            title="Refresh pending timesheets"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 ${
                isRefetching ? 'animate-spin' : ''
              }`}
            />
            Sync Now
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Pending Queue ({timesheets.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
            <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Loading pending timesheets...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-950/30 dark:bg-red-950/10">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-400">
              Failed to load pending timesheets
            </h3>
            <p className="mt-1 text-xs text-red-650 dark:text-red-500">
              {error.message}
            </p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-2xs dark:border-gray-800 dark:bg-gray-900">
            <div className="rounded-full bg-gray-50 p-3 text-gray-400 dark:bg-gray-800/40">
              <Inbox className="h-8 w-8 stroke-1" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
              No pending timesheets
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Timesheets with pending status will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {timesheets.map((timesheet) => (
              <button
                key={timesheet.timesheet_id}
                type="button"
                onClick={() => setSelectedTimesheet(timesheet)}
                className="flex w-full items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-2xs transition-all hover:border-blue-200 hover:bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/10"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {timesheet.client_name || 'Unassigned client'}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-gray-500 dark:text-gray-450">
                        Timesheet ID: {timesheet.timesheet_id}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(timesheet.status)}>
                      {timesheet.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {timesheet.source_type}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Week ending {formatDate(timesheet.week_ending)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Created {formatDateTime(timesheet.created_at)}
                    </span>
                  </div>

                  <p className="mt-2 truncate font-mono text-xs text-gray-400 dark:text-gray-600">
                    Email ID: {timesheet.email_id}
                  </p>
                </div>

                <ChevronRight className="mt-2 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedTimesheet)}
        onClose={() => setSelectedTimesheet(null)}
        title="Extracted Timesheet Data"
        size="xl"
      >
        {selectedTimesheet && (
          <div className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Timesheet ID
                </span>
                <p className="mt-1 break-all font-mono text-gray-900 dark:text-white">
                  {selectedTimesheet.timesheet_id}
                </p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Source
                </span>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {selectedTimesheet.source_type}
                </p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Week Ending
                </span>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {formatDate(selectedTimesheet.week_ending)}
                </p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Status
                </span>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(selectedTimesheet.status)}>
                    {selectedTimesheet.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Extracted Payload
              </span>
              <pre className="mt-2 max-h-[520px] overflow-auto rounded-xl border border-gray-100 bg-gray-950 p-4 text-xs leading-relaxed text-gray-100 dark:border-gray-800">
                {extractedPayload}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};