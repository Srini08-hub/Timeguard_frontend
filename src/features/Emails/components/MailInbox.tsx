import { useEffect, useMemo, useState } from 'react';
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

const mailFilterOptions = [
  { value: 'all', label: 'All Mails' },
  { value: 'timesheet', label: 'Timesheet' },
  { value: 'non-timesheet', label: 'Non-Timesheet' },
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

const sortByNewestReceived = (emails: TimesheetEmailResponse[]) => {
  return [...emails].sort((firstEmail, secondEmail) => (
    getReceivedTime(secondEmail) - getReceivedTime(firstEmail)
  ));
};

export const MailInbox = () => {
  const [selectedFilter, setSelectedFilter] = useState<MailFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  const allMailsQuery = useAllMails(selectedFilter === 'all');
  const timesheetQuery = useTimesheetMails(selectedFilter === 'timesheet');
  const nonTimesheetQuery = useNonTimesheetMails(selectedFilter === 'non-timesheet');

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const visibleEmails = useMemo(() => {
    if (selectedFilter === 'timesheet') return sortByNewestReceived(timesheetQuery.data ?? []);
    if (selectedFilter === 'non-timesheet') return sortByNewestReceived(nonTimesheetQuery.data ?? []);
    return sortByNewestReceived(allMailsQuery.data ?? []);
  }, [allMailsQuery.data, nonTimesheetQuery.data, selectedFilter, timesheetQuery.data]);

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

  const columns: TableColumn<TimesheetEmailResponse>[] = [
    {
      key: 'mail',
      header: 'Mail',
      accessor: (email) => (
        <div className="flex min-w-72 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900/50">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-gray-950 dark:text-white">
                {getSubject(email)}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
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
        <span className="block max-w-xl truncate text-sm text-gray-600 dark:text-gray-300">
          {getPreview(email.body)}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Mail ID',
      accessor: (email) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {email.email_id}
        </span>
      ),
    },
  ];

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
                Mail
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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

        <div className="grid border-b border-gray-200 dark:border-gray-800 md:grid-cols-3">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Visible mails
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {visibleEmails.length}
            </p>
          </div>
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Mailbox
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {filterLabels[selectedFilter]}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Current page
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {safeCurrentPage} / {totalPages}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="w-full xl:max-w-xs">
            <Select
              label="Mailbox"
              value={selectedFilter}
              options={mailFilterOptions}
              fullWidth
              onChange={(event) => setSelectedFilter(event.target.value as MailFilter)}
            />
          </div>
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

      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
        <FileText className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Open a mail row to inspect live status, message details, and attachment processing records.
        </p>
      </div>
    </div>
  );
};

