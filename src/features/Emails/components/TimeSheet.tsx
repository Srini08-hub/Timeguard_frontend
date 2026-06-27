import React, { useState } from 'react';
import { useTimesheetEmails } from '../hooks/useTimesheetEmails';
import { useAttachmentInfo } from '../hooks/useAttachmentInfo';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Mail, FileText, ExternalLink, Inbox, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';

export const TimeSheet: React.FC = () => {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const {
    data: emails = [],
    isLoading: isEmailsLoading,
    error: emailsError,
    refetch: refetchEmails,
    isRefetching: isEmailsRefetching,
  } = useTimesheetEmails();

  const {
    data: attachments = [],
    isLoading: isAttachmentsLoading,
    error: attachmentsError,
  } = useAttachmentInfo(selectedEmailId ?? undefined);

  const selectedEmail = emails.find(e => e.email_id === selectedEmailId);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return 'success';
      case 'received':
      case 'classified':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'not_processed':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with title and manual sync status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Timesheet Emails
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            View emails classified as timesheets and access their source documents. Refreshes automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEmailsRefetching && (
            <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse font-medium">
              Syncing...
            </span>
          )}
          <button
            onClick={() => refetchEmails()}
            disabled={isEmailsLoading}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50"
            title="Refresh manual database sync"
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 ${isEmailsRefetching ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Main split-screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Email list section (Left Column) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Timesheet Emails ({emails.length})
          </h2>

          {isEmailsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xs">
              <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading emails...</p>
            </div>
          ) : emailsError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/30 rounded-2xl">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-400">Failed to load emails</h3>
              <p className="mt-1 text-xs text-red-650 dark:text-red-500">{emailsError.message}</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-full text-gray-400">
                <Inbox className="h-8 w-8 stroke-1" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No timesheets found</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No emails have been classified as timesheets yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {emails.map((email) => {
                const isActive = email.email_id === selectedEmailId;
                const userInitials = email.sender_email
                  .split('@')[0]
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <a
                    key={email.email_id}
                    href={`#timesheet-${email.email_id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedEmailId(email.email_id);
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${isActive
                        ? 'bg-blue-50/40 dark:bg-blue-950/15 border-blue-200 dark:border-blue-900/60 ring-1 ring-blue-100 dark:ring-blue-950/30 shadow-2xs'
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                      }`}
                  >
                    {/* Visual Initial/Mail Icon wrapper */}
                    <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg text-xs font-bold font-mono ${isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-50 text-gray-650 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      {userInitials || <Mail className="h-4 w-4" />}
                    </div>

                    {/* Email info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {email.sender_email}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-450 font-mono truncate">
                        ID: {email.email_id}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Badge variant={getStatusVariant(email.status)}>
                          {email.status}
                        </Badge>
                      </div>
                    </div>

                    <ChevronRight className={`h-5 w-5 flex-shrink-0 self-center text-gray-400 dark:text-gray-600 transition-transform ${isActive ? 'translate-x-0.5 text-blue-500 dark:text-blue-400' : ''
                      }`} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Email Details & Attachment info (Right Column) */}
        <div className="lg:col-span-7">
          {selectedEmail ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xs p-6 space-y-6">

              {/* Card Header */}
              <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Active Selection
                    </span>
                    <h3 className="text-lg font-bold text-gray-950 dark:text-white truncate">
                      {selectedEmail.sender_email}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      Email ID: {selectedEmail.email_id}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(selectedEmail.status)} className="mt-1.5">
                    {selectedEmail.status}
                  </Badge>
                </div>
              </div>

              {/* Email Content Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500 dark:text-gray-450" />
                  Email Details
                </h4>
                <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-850 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-450 dark:text-gray-500 block uppercase tracking-wider">
                      Subject
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                      {selectedEmail.subject || <span className="text-gray-400 dark:text-gray-600 italic">No Subject</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-450 dark:text-gray-500 block uppercase tracking-wider mb-1">
                      Body
                    </span>
                    {selectedEmail.body ? (
                      <div className="text-sm text-gray-750 dark:text-gray-300 bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-gray-105 dark:border-gray-800 whitespace-pre-wrap break-words max-h-60 overflow-y-auto font-sans leading-relaxed">
                        {selectedEmail.body}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-650 italic">
                        No Body Content
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-450" />
                  Associated Timesheet Documents
                </h4>

                {isAttachmentsLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                    <Spinner className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading documents...</p>
                  </div>
                ) : attachmentsError ? (
                  <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/30 rounded-xl text-center">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-400">Failed to load attachments</p>
                    <p className="text-[11px] text-red-650 dark:text-red-500 mt-0.5">{attachmentsError.message}</p>
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="p-6 bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 text-center text-gray-400 dark:text-gray-600">
                    <Inbox className="h-6 w-6 mx-auto stroke-1" />
                    <p className="text-xs font-medium mt-2 text-gray-650 dark:text-gray-450">No documents found for this email.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.attachment_id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-850/20 transition-all"
                      >
                        <div className="min-w-0">
                          {/* File download/view hyperlink */}
                          <a
                            href={attachment.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline gap-1.5 focus:outline-none focus:underline"
                          >
                            <span className="truncate max-w-[240px] sm:max-w-[320px]">
                              {attachment.filename}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-450">
                            <span className="font-mono">ID: {attachment.attachment_id.substring(0, 8)}...</span>
                            <span>•</span>
                            <span>Type: {attachment.document_type || 'Unknown'}</span>
                          </div>

                          {attachment.failure_reason && (
                            <div className="mt-2 text-xs bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                              <span className="font-semibold">Failure ({attachment.failure_stage}):</span> {attachment.failure_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 self-start sm:self-center">
                          <Badge variant={getStatusVariant(attachment.status)}>
                            {attachment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 dark:bg-gray-900/20 border border-dashed border-gray-250 dark:border-gray-800 rounded-2xl min-h-[300px]">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-2xs text-gray-400 dark:text-gray-650">
                <Mail className="h-6 w-6 stroke-1.5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No Email Selected</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto">
                Select a timesheet email from the list on the left to inspect its status and retrieve timesheet documents.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
