import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Inbox,
  Mail,
  RefreshCw,
  Search,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
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

const getDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const parsedTime = Date.parse(value);
  return Number.isNaN(parsedTime) ? null : parsedTime;
};

const getInputDateTime = (value: string, useEndOfDay = false) => {
  if (!value) return null;
  const parsedTime = Date.parse(value + (useEndOfDay ? 'T23:59:59.999' : 'T00:00:00'));
  return Number.isNaN(parsedTime) ? null : parsedTime;
};

const matchesClientSearch = (timesheet: Timesheet, searchTerm: string) => {
  if (!searchTerm) return true;
  return (timesheet.client_name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
};

const matchesCreatedRange = (timesheet: Timesheet, fromDate: string, toDate: string) => {
  const createdTime = getDateTime(timesheet.created_at);
  const fromTime = getInputDateTime(fromDate);
  const toTime = getInputDateTime(toDate, true);

  if ((fromTime !== null || toTime !== null) && createdTime === null) return false;
  if (fromTime !== null && createdTime !== null && createdTime < fromTime) return false;
  if (toTime !== null && createdTime !== null && createdTime > toTime) return false;

  return true;
};

export const TimesheetPending = () => {
  const [activeTab] = useState<ClientMatchTab>('matched');
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('under_review');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [weekEndingFromInput, setWeekEndingFromInput] = useState('');
  const [weekEndingToInput, setWeekEndingToInput] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [weekEndingFrom, setWeekEndingFrom] = useState('');
  const [weekEndingTo, setWeekEndingTo] = useState('');
  const navigate = useNavigate();

  const underReviewQuery = useUnderReviewTimesheets();
  const processedQuery = useProcessedTimesheets();


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
  const unfilteredVisibleTimesheets = activeTab === 'matched' ? matchedTimesheets : unmatchedTimesheets;
  const visibleTimesheets = unfilteredVisibleTimesheets.filter((timesheet) => (
    matchesClientSearch(timesheet, clientSearch) &&
    matchesCreatedRange(timesheet, weekEndingFrom, weekEndingTo)
  ));

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

  const applyFilters = () => {
    setClientSearch(clientSearchInput.trim());
    setWeekEndingFrom(weekEndingFromInput);
    setWeekEndingTo(weekEndingToInput);
    setCurrentPage(1);
  };

  const openMailDetails = (
    timesheet: Timesheet,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    navigate('/reviewer/emails/' + timesheet.email_id, {
      state: {
        category: 'timesheet',
        filter: 'timesheet',
      },
    });
  };

  const stopMailButtonKeydown = (event: KeyboardEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const columns: TableColumn<Timesheet>[] = [
    {
      key: 'client',
      header: 'Client Name',
      accessor: (timesheet) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
          {timesheet.client_name || 'Needs client match'}
        </span>
      ),
    },
    {
      key: 'weekEnding',
      header: 'Week Ending',
      accessor: (timesheet) => (
        <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
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
      key: 'mail',
      header: 'Mail',
      className: 'text-center',
      accessor: (timesheet) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mx-auto h-9 w-9"
          icon={<Mail className="h-4 w-4" />}
          aria-label={'Open mail details for ' + (timesheet.client_name || 'timesheet')}
          title="Open mail details"
          onClick={(event) => openMailDetails(timesheet, event)}
          onKeyDown={stopMailButtonKeydown}
        />
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
      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-5 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
              <Inbox className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Timesheets
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
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

        <div className="grid gap-3 border-b border-[var(--border-color)] bg-white p-5 md:grid-cols-3">
          {/* <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Client matched</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{matchedTimesheets.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Needs client match</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{unmatchedTimesheets.length}</p>
          </div> */}
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Visible records</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{visibleTimesheets.length}</p>
          </div>
        </div>

        <div className="bg-white px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[16rem_12rem_12rem_minmax(14rem,1fr)_auto] xl:items-end">
            {activeTab === 'matched' && (
              <Select
                label="Review status"
                value={selectedStatus}
                options={statusOptions}
                fullWidth
                onChange={(event) => {
                  setSelectedStatus(event.target.value as ReviewStatus);
                  setCurrentPage(1);
                }}
              />
            )}

            <Input
              type="date"
              label="Created from"
              value={weekEndingFromInput}
              fullWidth
              onChange={(event) => setWeekEndingFromInput(event.target.value)}
            />
            <Input
              type="date"
              label="Created to"
              value={weekEndingToInput}
              fullWidth
              onChange={(event) => setWeekEndingToInput(event.target.value)}
            />
            <Input
              type="search"
              label="Client name"
              value={clientSearchInput}
              placeholder="Search client name"
              fullWidth
              onChange={(event) => setClientSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applyFilters();
                }
              }}
            />
            <Button
              type="button"
              icon={<Search className="h-4 w-4" />}
              onClick={applyFilters}
            >
              Search
            </Button>
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
