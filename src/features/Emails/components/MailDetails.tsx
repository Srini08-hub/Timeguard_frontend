import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Inbox,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useAttachmentInfo } from '../hooks/useAttachmentInfo';
import {
  type MailCategory,
  useEmailsByStatus,
  useNonTimesheetMails,
  useTimesheetMails,
} from '../hooks/useEmails';
import type { AttachmentInfo, AttachmentStatus, EmailStatus, TimesheetEmailResponse } from '../types';

interface MailLocationState {
  email?: TimesheetEmailResponse;
  status?: EmailStatus;
  category?: MailCategory;
}

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

const attachmentStatusLabels: Record<AttachmentStatus, string> = {
  pending: 'Pending',
  timesheet: 'Timesheet',
  not_timesheet: 'Not Timesheet',
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

const getAttachmentStatusVariant = (status: AttachmentStatus) => {
  if (status === 'processed' || status === 'timesheet') return 'success';
  if (status === 'failed' || status === 'not_processed') return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
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

export const MailDetails = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as MailLocationState | null;
  const routeStateEmail = routeState?.email;
  const stateEmail = routeStateEmail?.email_id === emailId ? routeStateEmail : undefined;
  const shouldLookupMail = !stateEmail;

  const { data: timesheetEmails = [], isLoading: isTimesheetLoading } = useTimesheetMails(shouldLookupMail);
  const { data: nonTimesheetEmails = [], isLoading: isNonTimesheetLoading } = useNonTimesheetMails(shouldLookupMail);
  const receivedQuery = useEmailsByStatus('received', shouldLookupMail);
  const classifiedQuery = useEmailsByStatus('classified', shouldLookupMail);
  const extractedQuery = useEmailsByStatus('extracted', shouldLookupMail);
  const mergedQuery = useEmailsByStatus('merged', shouldLookupMail);
  const processedQuery = useEmailsByStatus('processed', shouldLookupMail);
  const failedQuery = useEmailsByStatus('failed', shouldLookupMail);

  const lookupEmails = useMemo(() => {
    return [
      ...timesheetEmails,
      ...nonTimesheetEmails,
      ...(receivedQuery.data ?? []),
      ...(classifiedQuery.data ?? []),
      ...(extractedQuery.data ?? []),
      ...(mergedQuery.data ?? []),
      ...(processedQuery.data ?? []),
      ...(failedQuery.data ?? []),
    ];
  }, [
    classifiedQuery.data,
    extractedQuery.data,
    failedQuery.data,
    mergedQuery.data,
    nonTimesheetEmails,
    processedQuery.data,
    receivedQuery.data,
    timesheetEmails,
  ]);

  const selectedEmail = stateEmail || lookupEmails.find((email) => email.email_id === emailId);
  const isLookupLoading = shouldLookupMail && (
    isTimesheetLoading ||
    isNonTimesheetLoading ||
    receivedQuery.isLoading ||
    classifiedQuery.isLoading ||
    extractedQuery.isLoading ||
    mergedQuery.isLoading ||
    processedQuery.isLoading ||
    failedQuery.isLoading
  );
  const lookupError =
    receivedQuery.error ||
    classifiedQuery.error ||
    extractedQuery.error ||
    mergedQuery.error ||
    processedQuery.error ||
    failedQuery.error;

  const {
    data: attachments = [],
    error: attachmentsError,
    isLoading: isAttachmentsLoading,
    isRefetching: isAttachmentsRefetching,
    refetch: refetchAttachments,
  } = useAttachmentInfo(emailId);

  const mailType = useMemo(() => {
    if (routeState?.category === 'timesheet') return 'Timesheet';
    if (routeState?.category === 'non-timesheet') return 'Non-Timesheet';
    if (timesheetEmails.some((email) => email.email_id === emailId)) return 'Timesheet';
    if (nonTimesheetEmails.some((email) => email.email_id === emailId)) return 'Non-Timesheet';
    return 'Status Queue';
  }, [emailId, nonTimesheetEmails, routeState?.category, timesheetEmails]);

  const attachmentColumns: TableColumn<AttachmentInfo>[] = [
    {
      key: 'filename',
      header: 'Attachment',
      accessor: (attachment) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900/50">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-950 dark:text-white">
              {attachment.filename}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
              {attachment.attachment_id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'documentType',
      header: 'Document Type',
      accessor: (attachment) => attachment.document_type || 'Unclassified',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (attachment) => (
        <Badge variant={getAttachmentStatusVariant(attachment.status)}>
          {attachmentStatusLabels[attachment.status] || attachment.status}
        </Badge>
      ),
    },
    {
      key: 'failure',
      header: 'Failure Details',
      accessor: (attachment) => (
        <span className="block max-w-md truncate text-sm text-gray-600 dark:text-gray-300">
          {attachment.failure_reason || attachment.failure_stage || 'No failure recorded'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (attachment) => (
        <div className="flex justify-end">
          {attachment.attachment_url ? (
            <a
              href={attachment.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={'Open ' + attachment.filename}
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-600">No link</span>
          )}
        </div>
      ),
    },
  ];

  if (isLookupLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading mail details...</p>
        </div>
      </div>
    );
  }

  if (!selectedEmail) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/70 p-8 text-center dark:border-red-950/40 dark:bg-red-950/15">
        <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">
          Mail unavailable
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          {lookupError?.message || 'The selected mail could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate('/reviewer/emails')}>
          Back to Mail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/reviewer/emails')}
        >
          Mail
        </Button>
        <Button
          type="button"
          variant="outline"
          icon={<RefreshCw className={'h-4 w-4 ' + (isAttachmentsRefetching ? 'animate-spin' : '')} />}
          disabled={isAttachmentsLoading}
          onClick={() => refetchAttachments()}
        >
          Refresh Attachments
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                <Mail className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                    {getSubject(selectedEmail)}
                  </h1>
                  <Badge variant={getStatusVariant(selectedEmail.status)}>
                    {statusLabels[selectedEmail.status] || selectedEmail.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedEmail.sender_email}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Mail ID
              </p>
              <p className="mt-1 font-mono text-sm text-gray-950 dark:text-white">
                {selectedEmail.email_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Mail type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {mailType}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Attachments
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {attachments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Processing status
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {statusLabels[selectedEmail.status] || selectedEmail.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedEmail.status === 'failed' && (
        <section className="rounded-lg border border-red-200 bg-red-50/70 p-5 shadow-sm shadow-red-950/5 dark:border-red-950/40 dark:bg-red-950/15">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
                  Failure Details
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  This mail failed during processing. Review the stage and reason before retrying or investigating upstream data.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-red-200 bg-white p-4 dark:border-red-950/50 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-300">
                Failure stage
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-950 dark:text-white">
                {getFailureStage(selectedEmail)}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-white p-4 dark:border-red-950/50 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-300">
                Failure reason
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                {getFailureReason(selectedEmail)}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Mail Content</h2>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
            {selectedEmail.body || 'No body content available.'}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                Attachments
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review document type, processing status, and failure details for this mail.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {attachments.length} records
            </div>
          </div>
        </div>

        <Table
          data={attachments}
          columns={attachmentColumns}
          isLoading={isAttachmentsLoading}
          error={attachmentsError?.message}
          emptyMessage="No attachments were found for this mail."
          rowKey="attachment_id"
        />
      </section>
    </div>
  );
};




