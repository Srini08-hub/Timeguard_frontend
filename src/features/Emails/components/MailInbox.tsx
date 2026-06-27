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
  canFilterByMailCategory,
  mailStatuses,
  type MailCategory,
  useEmailsByStatus,
  useNonTimesheetMails,
  useTimesheetMails,
} from '../hooks/useEmails';
import type { EmailStatus, TimesheetEmailResponse } from '../types';

const MAILS_PER_PAGE = 10;

const statusOptions = mailStatuses.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

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
  return value.length > 45 ? value.slice(0, 45) + '...' : value;
};

const getSubject = (email: TimesheetEmailResponse) => {
  return email.subject?.trim() || 'No subject';
};

const getFailureStage = (email: TimesheetEmailResponse) => {
  return email.failure_stage?.trim() || 'Not recorded';
};

const getFailureReason = (email: TimesheetEmailResponse) => {
  return email.failure_reason?.trim() || 'No failure reason recorded';
};

export const MailInbox = () => {
  const [selectedStatus, setSelectedStatus] = useState<EmailStatus>('received');
  const [selectedCategory, setSelectedCategory] = useState<MailCategory>('timesheet');
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const showCategoryTabs = canFilterByMailCategory(selectedStatus);

  const {
    data: statusEmails = [],
    error: statusError,
    isLoading: isStatusLoading,
    isRefetching: isStatusRefetching,
    refetch: refetchStatusEmails,
  } = useEmailsByStatus(selectedStatus, !showCategoryTabs);
  const {
    data: timesheetEmails = [],
    error: timesheetError,
    isLoading: isTimesheetLoading,
    isRefetching: isTimesheetRefetching,
    refetch: refetchTimesheetEmails,
  } = useTimesheetMails(showCategoryTabs && selectedCategory === 'timesheet');
  const {
    data: nonTimesheetEmails = [],
    error: nonTimesheetError,
    isLoading: isNonTimesheetLoading,
    isRefetching: isNonTimesheetRefetching,
    refetch: refetchNonTimesheetEmails,
  } = useNonTimesheetMails(showCategoryTabs && selectedCategory === 'non-timesheet');

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    if (!showCategoryTabs) {
      setSelectedCategory('timesheet');
    }
  }, [showCategoryTabs]);

  const visibleEmails = useMemo(() => {
    if (!showCategoryTabs) return statusEmails;

    const source = selectedCategory === 'timesheet' ? timesheetEmails : nonTimesheetEmails;
    return source.filter((email) => email.status === selectedStatus);
  }, [nonTimesheetEmails, selectedCategory, selectedStatus, showCategoryTabs, statusEmails, timesheetEmails]);

  const activeError = showCategoryTabs
    ? selectedCategory === 'timesheet'
      ? timesheetError
      : nonTimesheetError
    : statusError;
  const isLoading = showCategoryTabs
    ? selectedCategory === 'timesheet'
      ? isTimesheetLoading
      : isNonTimesheetLoading
    : isStatusLoading;
  const isRefetching = showCategoryTabs
    ? selectedCategory === 'timesheet'
      ? isTimesheetRefetching
      : isNonTimesheetRefetching
    : isStatusRefetching;

  const totalPages = Math.max(1, Math.ceil(visibleEmails.length / MAILS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmails = visibleEmails.slice(
    (safeCurrentPage - 1) * MAILS_PER_PAGE,
    safeCurrentPage * MAILS_PER_PAGE,
  );

  const refetchVisibleEmails = () => {
    if (!showCategoryTabs) {
      refetchStatusEmails();
      return;
    }

    if (selectedCategory === 'timesheet') {
      refetchTimesheetEmails();
      return;
    }

    refetchNonTimesheetEmails();
  };

  const openMail = (email: TimesheetEmailResponse) => {
    navigate(email.email_id, {
      state: {
        email,
        status: selectedStatus,
        category: showCategoryTabs ? selectedCategory : undefined,
      },
    });
  };

  const baseColumns: TableColumn<TimesheetEmailResponse>[] = [
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
      key: 'category',
      header: 'Type',
      accessor: () => (
        <Badge variant={showCategoryTabs ? 'primary' : 'neutral'}>
          {showCategoryTabs
            ? selectedCategory === 'timesheet'
              ? 'Timesheet'
              : 'Non-Timesheet'
            : 'Status Queue'}
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

  const failedColumns: TableColumn<TimesheetEmailResponse>[] = selectedStatus === 'failed'
    ? [
        {
          key: 'failureStage',
          header: 'Failure Stage',
          accessor: (email) => (
            <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-500/25">
              {getFailureStage(email)}
            </span>
          ),
        },
        {
          key: 'failureReason',
          header: 'Failure Reason',
          accessor: (email) => (
            <span className="block max-w-lg truncate text-sm text-gray-600 dark:text-gray-300">
              {getFailureReason(email)}
            </span>
          ),
        },
      ]
    : [];

  const columns = [...baseColumns.slice(0, 3), ...failedColumns, ...baseColumns.slice(3)];

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
                Review inbound mail by processing status and inspect attachments from one workspace.
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

        <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="w-full xl:max-w-xs">
            <Select
              label="Status"
              value={selectedStatus}
              options={statusOptions}
              fullWidth
              onChange={(event) => setSelectedStatus(event.target.value as EmailStatus)}
            />
          </div>

          {showCategoryTabs && (
            <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900 xl:w-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory('timesheet')}
                className={
                  'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors xl:flex-none ' +
                  (selectedCategory === 'timesheet'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:text-blue-300 dark:ring-gray-800'
                    : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white')
                }
              >
                Timesheet
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('non-timesheet')}
                className={
                  'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors xl:flex-none ' +
                  (selectedCategory === 'non-timesheet'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:text-blue-300 dark:ring-gray-800'
                    : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white')
                }
              >
                Non-Timesheet
              </button>
            </div>
          )}
        </div>
      </section>

      <Table
        data={paginatedEmails}
        columns={columns}
        isLoading={isLoading}
        error={activeError?.message}
        emptyMessage="No mails match the selected filters."
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
          Open a mail row to inspect the full message and attachment processing status.
        </p>
      </div>
    </div>
  );
};
