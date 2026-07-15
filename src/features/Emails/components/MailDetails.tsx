import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
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
  type MailFilter,
  useAllMails,
  useNonTimesheetMails,
  useTimesheetMails,
} from '../hooks/useEmails';
import type { AttachmentInfo, AttachmentStatus, EmailStatus, TimesheetEmailResponse } from '../types';

interface MailLocationState {
  email?: TimesheetEmailResponse;
  status?: EmailStatus;
  category?: MailCategory;
  filter?: MailFilter;
  returnTo?: string;
}

const STATUS_REFETCH_INTERVAL = 3000;

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

const statusSteps: EmailStatus[] = [
  'received',
  'classified',
  'extracted',
  'merged',
  'processed',
];

const attachmentStatusLabels: Record<AttachmentStatus, string> = {
  pending: 'Pending',
  timesheet: 'Timesheet',
  not_timesheet: 'Not Timesheet',
  processed: 'Processed',
  not_processed: 'Not Processed',
  failed: 'Failed',
};

const emailStatusVariants: Record<EmailStatus, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  not_received: 'neutral',
  received: 'success',
  classified: 'success',
  extracted: 'info',
  merged: 'success',
  processed: 'success',
  not_processed: 'danger',
  failed: 'danger',
};

const getStatusVariant = (status: EmailStatus) => emailStatusVariants[status] ?? 'neutral';

const getStatusStepClasses = (status: EmailStatus, isActive: boolean) => {
  const variant = getStatusVariant(status);
  if (variant === 'success') return 'border-[var(--success-border)] bg-[var(--success-border)] text-white';
  if (variant === 'danger') return 'border-red-600 bg-red-600 text-white';
  if (variant === 'warning') return 'border-amber-500 bg-amber-500 text-white';
  if (isActive && (variant === 'info' || variant === 'primary')) return 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15';
  return 'border-[var(--border-color)] bg-white text-[var(--text-muted)]';
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

const getStatusStepState = (currentStatus: EmailStatus, step: EmailStatus) => {
  if (currentStatus === 'failed' || currentStatus === 'not_processed') {
    return step === 'received' || step === 'classified' ? 'complete' : 'pending';
  }

  if (currentStatus === 'processed') {
    return 'complete';
  }

  const currentIndex = statusSteps.indexOf(currentStatus);
  const stepIndex = statusSteps.indexOf(step);

  if (currentIndex === -1) return 'pending';
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
};

const dedupeEmails = (emails: TimesheetEmailResponse[]) => {
  const byId = new Map<string, TimesheetEmailResponse>();
  emails.forEach((email) => byId.set(email.email_id, email));
  return Array.from(byId.values());
};

export const MailDetails = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as MailLocationState | null;
  const returnTo = routeState?.returnTo || '/reviewer/emails';
  const routeStateEmail = routeState?.email;
  const stateEmail = routeStateEmail?.email_id === emailId ? routeStateEmail : undefined;

  const allMailsQuery = useAllMails(true, STATUS_REFETCH_INTERVAL);
  const { data: timesheetEmails = [], isLoading: isTimesheetLoading } = useTimesheetMails(true, STATUS_REFETCH_INTERVAL);
  const { data: nonTimesheetEmails = [], isLoading: isNonTimesheetLoading } = useNonTimesheetMails(true, STATUS_REFETCH_INTERVAL);

  const lookupEmails = useMemo(() => {
    return dedupeEmails([
      ...(allMailsQuery.data ?? []),
      ...timesheetEmails,
      ...nonTimesheetEmails,
    ]);
  }, [allMailsQuery.data, nonTimesheetEmails, timesheetEmails]);

  const liveEmail = lookupEmails.find((email) => email.email_id === emailId);
  const selectedEmail = liveEmail || stateEmail;
  const isLookupLoading = !selectedEmail && (allMailsQuery.isLoading || isTimesheetLoading || isNonTimesheetLoading);
  const lookupError = allMailsQuery.error;

  const {
    data: attachments = [],
    error: attachmentsError,
    isLoading: isAttachmentsLoading,
    isRefetching: isAttachmentsRefetching,
    refetch: refetchAttachments,
  } = useAttachmentInfo(emailId, STATUS_REFETCH_INTERVAL);

  const mailType = useMemo(() => {
    if (routeState?.category === 'timesheet' || routeState?.filter === 'timesheet') return 'Timesheet';
    if (routeState?.category === 'non-timesheet' || routeState?.filter === 'non-timesheet') return 'Non-Timesheet';
    if (timesheetEmails.some((email) => email.email_id === emailId)) return 'Timesheet';
    if (nonTimesheetEmails.some((email) => email.email_id === emailId)) return 'Non-Timesheet';
    return 'All Mails';
  }, [emailId, nonTimesheetEmails, routeState?.category, routeState?.filter, timesheetEmails]);

  const attachmentColumns: TableColumn<AttachmentInfo>[] = [
    {
      key: 'filename',
      header: 'Attachment',
      accessor: (attachment) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-blue-100">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {attachment.filename}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">
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
        <span className="block max-w-md truncate text-sm text-[var(--text-secondary)]">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]"
              aria-label={'Open ' + attachment.filename}
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">No link</span>
          )}
        </div>
      ),
    },
  ];

  if (isLookupLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading mail details...</p>
        </div>
      </div>
    );
  }

  if (!selectedEmail) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">
          Mail unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          {lookupError?.message || 'The selected mail could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate(returnTo)}>
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
          onClick={() => navigate(returnTo)}
        >
          Mail
        </Button>
        <Button
          type="button"
          variant="outline"
          icon={<RefreshCw className={'h-4 w-4 ' + (isAttachmentsRefetching || allMailsQuery.isRefetching ? 'animate-spin' : '')} />}
          disabled={isAttachmentsLoading}
          onClick={() => {
            allMailsQuery.refetch();
            refetchAttachments();
          }}
        >
          Refresh
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <Mail className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {getSubject(selectedEmail)}
                  </h1>
                  <Badge variant={getStatusVariant(selectedEmail.status)}>
                    {statusLabels[selectedEmail.status] || selectedEmail.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {selectedEmail.sender_email}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Live refresh
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                Every 3 seconds
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {statusSteps.map((step, index) => {
              const state = getStatusStepState(selectedEmail.status, step);
              const isComplete = state === 'complete';
              const isActive = state === 'active';
              return (
                <div key={step} className="flex flex-1 items-center gap-3">
                  <div
                    className={
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ' +
                      (isComplete || isActive
                        ? getStatusStepClasses(step, isActive)
                        : 'border-[var(--border-color)] bg-white text-[var(--text-muted)]')
                    }
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={
                        'text-sm font-semibold ' +
                        (isComplete || isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')
                      }
                    >
                      {statusLabels[step]}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isComplete ? 'Completed' : isActive ? 'Current step' : 'Waiting'}
                    </p>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={
                        'hidden h-px flex-1 lg:block ' +
                        (isComplete ? 'bg-[var(--success-border)]' : 'bg-[var(--border-color)]')
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {(selectedEmail.status === 'failed' || selectedEmail.status === 'not_processed') && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Processing stopped</p>
                <p className="mt-1">
                  {getFailureStage(selectedEmail)}: {getFailureReason(selectedEmail)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="grid md:grid-cols-3">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Mail type
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {mailType}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Attachments
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {attachments.length}
                </p>
              </div>
            </div>
          </div>

          {/* <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-card-soft)] text-[var(--text-secondary)]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Mail ID
                </p>
                <p className="mt-1 max-w-56 truncate font-mono text-sm font-semibold text-[var(--text-primary)]">
                  {selectedEmail.email_id}
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border-color)] bg-white p-5 shadow-sm shadow-gray-950/5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Mail Content</h2>
        <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
            {selectedEmail.body || 'No body content available.'}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
          <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Attachments
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Review document type, processing status, and failure details for this mail.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)]">
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
