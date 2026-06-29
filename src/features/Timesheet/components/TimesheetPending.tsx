import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  FileText,
  Inbox,
  RefreshCw,
  SearchCheck,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useProcessedTimesheets, useUnderReviewTimesheets } from '../hooks/useTimesheets';
import type { Timesheet } from '../types';

const TIMESHEETS_PER_PAGE = 10;
type ClientMatchTab = 'matched' | 'unmatched';
type ReviewStatus = 'under_review' | 'processed';

const statusOptions = [
  { value: 'under_review', label: 'Under Review' },
  { value: 'processed', label: 'Processed' },
];

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const getStatusLabel = (status: string | null | undefined) => {
  if (status === 'under_review') return 'Under Review';
  if (status === 'processed') return 'Processed';
  if (status === 'pending') return 'Pending';
  return status || 'Unknown';
};

const getStatusVariant = (status: string | null | undefined) => {
  if (status === 'processed') return 'success';
  if (status === 'under_review' || status === 'pending') return 'warning';
  return 'neutral';
};

const hasClientName = (timesheet: Timesheet) => Boolean(timesheet.client_name?.trim());

export const TimesheetPending = () => {
  const [activeTab, setActiveTab] = useState<ClientMatchTab>('matched');
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('under_review');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const underReviewQuery = useUnderReviewTimesheets();
  const processedQuery = useProcessedTimesheets();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedStatus]);

  const selectedStatusTimesheets = selectedStatus === 'under_review'
    ? underReviewQuery.data ?? []
    : processedQuery.data ?? [];

  const allKnownTimesheets = useMemo(() => {
    const byId = new Map<string, Timesheet>();
    [...(underReviewQuery.data ?? []), ...(processedQuery.data ?? [])].forEach((timesheet) => {
      byId.set(timesheet.timesheet_id, timesheet);
    });
    return Array.from(byId.values());
  }, [processedQuery.data, underReviewQuery.data]);

  const matchedTimesheets = selectedStatusTimesheets.filter(hasClientName);
  const unmatchedTimesheets = allKnownTimesheets.filter((timesheet) => !hasClientName(timesheet));
  const visibleTimesheets = activeTab === 'matched' ? matchedTimesheets : unmatchedTimesheets;

  const isLoading = activeTab === 'matched'
    ? selectedStatus === 'under_review'
      ? underReviewQuery.isLoading
      : processedQuery.isLoading
    : underReviewQuery.isLoading || processedQuery.isLoading;
  const isRefetching = underReviewQuery.isRefetching || processedQuery.isRefetching;
  const error = activeTab === 'matched'
    ? selectedStatus === 'under_review'
      ? underReviewQuery.error
      : processedQuery.error
    : underReviewQuery.error || processedQuery.error;

  const totalPages = Math.max(1, Math.ceil(visibleTimesheets.length / TIMESHEETS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTimesheets = visibleTimesheets.slice(
    (safeCurrentPage - 1) * TIMESHEETS_PER_PAGE,
    safeCurrentPage * TIMESHEETS_PER_PAGE,
  );

  const refreshQueues = () => {
    underReviewQuery.refetch();
    processedQuery.refetch();
  };

  const columns: TableColumn<Timesheet>[] = [
    // {
    //   key: 'email',
    //   header: 'Email ID',
    //   accessor: (timesheet) => (
    //     <div className="flex min-w-72 items-center gap-3">
    //       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900/50">
    //         <FileText className="h-4 w-4" />
    //       </div>
    //       <div className="min-w-0">
    //         <div className="flex items-center gap-2">
    //           <span className="truncate font-mono text-sm font-semibold text-gray-950 dark:text-white">
    //             {timesheet.email_id}
    //           </span>
    //           <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
    //         </div>
    //         <span className="mt-0.5 block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
    //           {timesheet.timesheet_id}
    //         </span>
    //       </div>
    //     </div>
    //   ),
    // },
    {
      key: 'client',
      header: 'Client Name',
      accessor: (timesheet) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <Building2 className="h-4 w-4 text-gray-400" />
          {timesheet.client_name || 'Needs client match'}
        </span>
      ),
    },
    {
      key: 'weekEnding',
      header: 'Week Ending',
      accessor: (timesheet) => (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {formatDate(timesheet.week_ending)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (timesheet) => (
        <Badge variant={getStatusVariant(timesheet.status)}>
          {getStatusLabel(timesheet.status)}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (timesheet) => formatDateTime(timesheet.created_at),
    },
  ];

  const openTimesheet = (timesheet: Timesheet) => {
    navigate(timesheet.timesheet_id, {
      state: { timesheet },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-5 border-b border-gray-200 px-5 py-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <Inbox className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                Timesheets
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review client-matched timesheets, inspect extracted data, and open source attachments.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            icon={<RefreshCw className={'h-4 w-4 ' + (isRefetching ? 'animate-spin' : '')} />}
            disabled={isLoading}
            onClick={refreshQueues}
          >
            Refresh
          </Button>
        </div>

        <div className="grid border-b border-gray-200 dark:border-gray-800 md:grid-cols-3">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Client matched
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {allKnownTimesheets.filter(hasClientName).length}
            </p>
          </div>
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Needs client match
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {unmatchedTimesheets.length}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Visible records
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {visibleTimesheets.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900 xl:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('matched')}
              className={
                'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors xl:flex-none ' +
                (activeTab === 'matched'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:text-blue-300 dark:ring-gray-800'
                  : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white')
              }
            >
              Client Matched
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unmatched')}
              className={
                'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors xl:flex-none ' +
                (activeTab === 'unmatched'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:text-blue-300 dark:ring-gray-800'
                  : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white')
              }
            >
              Needs Client Match
            </button>
          </div>

          {activeTab === 'matched' && (
            <div className="w-full xl:max-w-xs">
              <Select
                label="Review status"
                value={selectedStatus}
                options={statusOptions}
                fullWidth
                onChange={(event) => setSelectedStatus(event.target.value as ReviewStatus)}
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <SearchCheck className="h-4 w-4 text-blue-500" />
            <span>
              {activeTab === 'matched'
                ? 'Showing matched records for the selected status.'
                : 'Showing records that still need a client name.'}
            </span>
          </div>
        </div>
      </section>

      <Table
        data={paginatedTimesheets}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No timesheets match the selected filters."
        rowKey="timesheet_id"
        onRowClick={openTimesheet}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
};

