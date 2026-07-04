import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  FileText,
  Inbox,
  Mail,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table, type TableColumn } from '../../../components/ui/Table';
import {
  type MailFilter,
  useAllMails,
  useNonTimesheetMails,
  useTimesheetMails,
} from '../hooks/useEmails';
import type { EmailStatus, TimesheetEmailResponse } from '../types';

const MAILS_PER_PAGE = 10;
type MailStatusFilter = 'all' | 'processed' | 'failed';

const mailFilterOptions: { value: MailFilter; label: string }[] = [
  { value: 'all', label: 'All Mails' },
  { value: 'timesheet', label: 'Timesheet' },
  { value: 'non-timesheet', label: 'Non-Timesheet' },
];

const mailStatusOptions: { value: MailStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
];

const filterLabels: Record<MailFilter, string> = {
  all: 'All Mails',
  timesheet: 'Timesheet',
  'non-timesheet': 'Non-Timesheet',
};

const statusLabels: Record<EmailStatus, string> = {
  not_received: 'Not Received',
  received: 'Received',
  classified: 'Classified',
  extracted: 'Extracted',
  merged: 'Merged',
  processed: 'Processed',
  not_processed: 'Not Processed',
  failed: 'Failed',
};

const getStatusVariant = (status: EmailStatus) => {
  if (status === 'processed' || status === 'merged') return 'success';
  if (status === 'failed' || status === 'not_processed') return 'danger';
  if (status === 'extracted' || status === 'classified') return 'info';
  if (status === 'received') return 'warning';
  return 'neutral';
};

const getPreview = (value: string | null) => {
  if (!value) return 'No body content available';
  return value.length > 40 ? value.slice(0, 40) + '...' : value;
};

const getSubject = (email: TimesheetEmailResponse) => {
  return email.subject?.trim() || 'No subject';
};

const getReceivedTime = (email: TimesheetEmailResponse) => {
  const receivedTime = Date.parse(email.received_at);
  return Number.isNaN(receivedTime) ? 0 : receivedTime;
};

const formatReceivedAt = (value: string) => {
  const receivedTime = Date.parse(value);
  if (Number.isNaN(receivedTime)) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(receivedTime));
};

const getInputDateTime = (value: string, useEndOfDay = false) => {
  if (!value) return null;
  const parsedTime = Date.parse(value + (useEndOfDay ? 'T23:59:59.999' : 'T00:00:00'));
  return Number.isNaN(parsedTime) ? null : parsedTime;
};

const matchesReceivedRange = (email: TimesheetEmailResponse, fromDate: string, toDate: string) => {
  const receivedTime = Date.parse(email.received_at);
  const fromTime = getInputDateTime(fromDate);
  const toTime = getInputDateTime(toDate, true);

  if ((fromTime !== null || toTime !== null) && Number.isNaN(receivedTime)) return false;
  if (fromTime !== null && !Number.isNaN(receivedTime) && receivedTime < fromTime) return false;
  if (toTime !== null && !Number.isNaN(receivedTime) && receivedTime > toTime) return false;

  return true;
};

const sortByNewestReceived = (emails: TimesheetEmailResponse[]) => {
  return [...emails].sort((firstEmail, secondEmail) => (
    getReceivedTime(secondEmail) - getReceivedTime(firstEmail)
  ));
};

export const MailInbox = () => {
  const [selectedFilter, setSelectedFilter] = useState<MailFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<MailStatusFilter>('all');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [receivedTo, setReceivedTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  const allMailsQuery = useAllMails(selectedFilter === 'all');
  const timesheetQuery = useTimesheetMails(selectedFilter === 'timesheet');
  const nonTimesheetQuery = useNonTimesheetMails(selectedFilter === 'non-timesheet');


  const visibleEmails = useMemo(() => {
    const sourceEmails = selectedFilter === 'timesheet'
      ? timesheetQuery.data ?? []
      : selectedFilter === 'non-timesheet'
        ? nonTimesheetQuery.data ?? []
        : allMailsQuery.data ?? [];

    const statusFilteredEmails = selectedStatus === 'all'
      ? sourceEmails
      : sourceEmails.filter((email) => email.status === selectedStatus);

    const dateFilteredEmails = statusFilteredEmails.filter((email) => (
      matchesReceivedRange(email, receivedFrom, receivedTo)
    ));

    return sortByNewestReceived(dateFilteredEmails);
  }, [allMailsQuery.data, nonTimesheetQuery.data, receivedFrom, receivedTo, selectedFilter, selectedStatus, timesheetQuery.data]);


  const activeError = selectedFilter === 'timesheet'
    ? timesheetQuery.error
    : selectedFilter === 'non-timesheet'
      ? nonTimesheetQuery.error
      : allMailsQuery.error;
  const isLoading = selectedFilter === 'timesheet'
    ? timesheetQuery.isLoading
    : selectedFilter === 'non-timesheet'
      ? nonTimesheetQuery.isLoading
      : allMailsQuery.isLoading;
  const isRefetching = selectedFilter === 'timesheet'
    ? timesheetQuery.isRefetching
    : selectedFilter === 'non-timesheet'
      ? nonTimesheetQuery.isRefetching
      : allMailsQuery.isRefetching;

  const totalPages = Math.max(1, Math.ceil(visibleEmails.length / MAILS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmails = visibleEmails.slice(
    (safeCurrentPage - 1) * MAILS_PER_PAGE,
    safeCurrentPage * MAILS_PER_PAGE,
  );

  const refetchVisibleEmails = () => {
    if (selectedFilter === 'timesheet') {
      timesheetQuery.refetch();
      return;
    }

    if (selectedFilter === 'non-timesheet') {
      nonTimesheetQuery.refetch();
      return;
    }

    allMailsQuery.refetch();
  };

  const openMail = (email: TimesheetEmailResponse) => {
    navigate(email.email_id, {
      state: {
        email,
        filter: selectedFilter,
      },
    });
  };

  const selectMailboxFilter = (filter: MailFilter) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  const selectStatusFilter = (status: MailStatusFilter) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const selectReceivedFrom = (value: string) => {
    setReceivedFrom(value);
    setCurrentPage(1);
  };

  const selectReceivedTo = (value: string) => {
    setReceivedTo(value);
    setCurrentPage(1);
  };


  const columns: TableColumn<TimesheetEmailResponse>[] = [
    {
      key: 'mail',
      header: 'Mail',
      accessor: (email) => (
        <div className="flex min-w-72 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-blue-100">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-[var(--text-primary)]">
                {getSubject(email)}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </div>
            <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
              {email.sender_email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (email) => (
        <Badge variant={getStatusVariant(email.status)}>
          {statusLabels[email.status] || email.status}
        </Badge>
      ),
    },
    {
      key: 'receivedAt',
      header: 'Received At',
      accessor: (email) => (
        <span className="whitespace-nowrap text-sm text-[var(--text-secondary)]">
          {formatReceivedAt(email.received_at)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Mailbox',
      accessor: () => (
        <Badge variant={selectedFilter === 'all' ? 'neutral' : 'primary'}>
          {filterLabels[selectedFilter]}
        </Badge>
      ),
    },
    {
      key: 'preview',
      header: 'Preview',
      accessor: (email) => (
        <span className="block max-w-xl truncate text-sm text-[var(--text-secondary)]">
          {getPreview(email.body)}
        </span>
      ),
    },
  ];

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
                Mail
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Review inbound mail in one workspace and open each record for live processing status.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            icon={<RefreshCw className={'h-4 w-4 ' + (isRefetching ? 'animate-spin' : '')} />}
            disabled={isLoading}
            onClick={refetchVisibleEmails}
          >
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 border-b border-[var(--border-color)] bg-white p-5 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Visible mails
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {visibleEmails.length}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Mailbox
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {filterLabels[selectedFilter]}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Current page
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {safeCurrentPage} / {totalPages}
            </p>
          </div>
        </div>

        <div className="grid gap-4 bg-white px-5 py-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_16rem] lg:items-end">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Mailbox</p>
            <div className="inline-flex w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-1 sm:w-auto">
              {mailFilterOptions.map((option) => {
                const isSelected = selectedFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectMailboxFilter(option.value)}
                    className={
                      'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ' +
                      (isSelected
                        ? 'bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-color)]'
                        : 'text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]')
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            type="date"
            label="Received from"
            value={receivedFrom}
            fullWidth
            onChange={(event) => selectReceivedFrom(event.target.value)}
          />
          <Input
            type="date"
            label="Received to"
            value={receivedTo}
            fullWidth
            onChange={(event) => selectReceivedTo(event.target.value)}
          />
          <Select
            label="Processing status"
            value={selectedStatus}
            options={mailStatusOptions}
            fullWidth
            onChange={(event) => selectStatusFilter(event.target.value as MailStatusFilter)}
          />
        </div>
      </section>

      <Table
        data={paginatedEmails}
        columns={columns}
        isLoading={isLoading}
        error={activeError?.message}
        emptyMessage="No mails match the selected mailbox."
        rowKey="email_id"
        onRowClick={openMail}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-[var(--primary-soft)] p-4 text-sm text-[var(--primary-hover)]">
        <FileText className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Open a mail row to inspect live status, message details, and attachment processing records.
        </p>
      </div>
    </div>
  );
};




