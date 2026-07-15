import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  ReceiptText,
  UserRound,
  XCircle,
} from 'lucide-react';

import { Badge, type BadgeProps } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { Textarea } from '../../../components/ui/Textarea';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useToast } from '../../../hooks/useToast';
import { useAttachmentInfo } from '../../Emails/hooks/useAttachmentInfo';
import type { AttachmentInfo } from '../../Emails/types';
import { useClient } from '../../Client/hooks/useClients';
import { useDepartmentsByClient } from '../../Department/hooks/useDepartments';
import { useEmployee } from '../../Employee/hooks/useEmployees';
import { useClientRule } from '../../ClientRules/hooks/useClientRules';
import type { ClientRuleNumber } from '../../ClientRules/types';
import {
  useApproveTimecard,
  useRejectTimecard,
  useResolveTimecard,
  useTimecard,
} from '../hooks/useTimecards';
import {
  useProcessedTimesheets,
  useUnderReviewTimesheets,
} from '../hooks/useTimesheets';
import type {
  EmployeeRecord,
  MergeResponse,
  SourceInfo,
  TimecardEntry,
  TimecardException,
  Timesheet,
  TimesheetExtractedPayload,
  TimesheetRecord,
} from '../types';

interface EmployeeReviewLocationState {
  returnTo?: string;
  timecard?: TimecardEntry;
  timesheet?: Timesheet;
}

type ReviewTab = 'merged' | 'rules' | 'exceptions';

interface SourceView {
  key: string;
  fileName: string;
  sourceType: string;
  attachmentUrl?: string;
}

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

const normalizeStatusValue = (status: string | null | undefined) => normalize(status).replace(/[\s-]+/g, '_');

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const formatHours = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return '0.00';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
};

const formatStatus = (status: string) => {
  const normalizedStatus = normalizeStatusValue(status);
  if (normalizedStatus === 'no_exception' || normalizedStatus === 'clean') return 'Ready for Approval';
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDetailValue = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue || 'Not available';
};

const formatMatchingScore = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'Not available';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) + '%' : String(value);
};

const getStatusVariant = (status: string): NonNullable<BadgeProps['variant']> => {
  const normalizedStatus = normalizeStatusValue(status);
  if (normalizedStatus === 'no_exception' || normalizedStatus === 'clean' || normalizedStatus === 'approved') return 'success';
  if (normalizedStatus === 'exception') return 'warning';
  if (normalizedStatus === 'rejected') return 'danger';
  if (normalizedStatus === 'pending') return 'warning';
  return 'neutral';
};

const isFinalTimecardStatus = (status: string | null | undefined) => {
  const normalizedStatus = normalizeStatusValue(status);
  return normalizedStatus === 'approved' || normalizedStatus === 'rejected';
};

const hasUnresolvedExceptions = (timecard: TimecardEntry) => {
  if ((timecard.exceptions ?? []).length > 0) {
    return timecard.exceptions.some((exception) => !exception.resolved);
  }
  return normalizeStatusValue(timecard.status) === 'exception';
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isMergeResponse = (payload: TimesheetExtractedPayload | null | undefined): payload is MergeResponse => {
  return isRecord(payload) && ('global_data' in payload || 'employee_records' in payload);
};

const getEmployeeRecords = (payload: TimesheetExtractedPayload | null | undefined): EmployeeRecord[] => {
  if (!isMergeResponse(payload)) return [];
  return Array.isArray(payload.employee_records) ? payload.employee_records : [];
};

const normalizeAttachmentName = (value: string) => {
  const fileName = value.trim().split(/[\\/]/).pop() || value.trim();
  return fileName.toLowerCase();
};

const buildAttachmentUrlByName = (attachments: AttachmentInfo[]) => {
  const byName = new Map<string, string>();
  attachments.forEach((attachment) => {
    if (!attachment.filename || !attachment.attachment_url) return;
    byName.set(normalizeAttachmentName(attachment.filename), attachment.attachment_url);
  });
  return byName;
};

const toRuleNumber = (value: ClientRuleNumber | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatRuleHours = (value: ClientRuleNumber | null | undefined) => {
  const numericValue = toRuleNumber(value);
  return numericValue === null ? 'Not set' : numericValue.toFixed(2) + ' hrs';
};

const formatRuleMultiplier = (value: ClientRuleNumber | null | undefined) => {
  const numericValue = toRuleNumber(value);
  return numericValue === null ? 'Not set' : numericValue.toFixed(2) + 'x';
};

const openAttachmentInNewTab = (attachmentUrl: string) => {
  window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
};

const buildSourceViews = (
  employeeRecord: EmployeeRecord | undefined,
  attachments: AttachmentInfo[],
): SourceView[] => {
  const attachmentUrlByName = buildAttachmentUrlByName(attachments);
  const employeeSources = employeeRecord?.source ?? [];

  if (employeeSources.length > 0) {
    return employeeSources.map((source: SourceInfo, sourceIndex) => ({
      key: source.file_name + '-' + sourceIndex,
      fileName: source.file_name,
      sourceType: source.content_type || 'Not available',
      attachmentUrl: attachmentUrlByName.get(normalizeAttachmentName(source.file_name)),
    }));
  }

  return attachments.map((attachment) => ({
    key: attachment.attachment_id,
    fileName: attachment.filename,
    sourceType: attachment.document_type || attachment.status,
    attachmentUrl: attachment.attachment_url,
  }));
};

const recordColumns: TableColumn<TimesheetRecord>[] = [
  { key: 'date', header: 'Date', accessor: (record) => stringifyValue(record.date) },
  { key: 'day', header: 'Day', accessor: (record) => stringifyValue(record.day) },
  { key: 'checkIn', header: 'Check In', accessor: (record) => stringifyValue(record.check_in ?? record.in_time) },
  { key: 'checkOut', header: 'Check Out', accessor: (record) => stringifyValue(record.check_out ?? record.out_time) },
  { key: 'break', header: 'Break', accessor: (record) => stringifyValue(record.break_hour) },
  { key: 'hours', header: 'Hours', accessor: (record) => stringifyValue(record.hours ?? record.total_hours) },
  { key: 'overtime', header: 'Overtime', accessor: (record) => stringifyValue(record.overtime_hours) },
  { key: 'confidence', header: 'Confidence', accessor: (record) => stringifyValue(record.confidence) },
];

const exceptionColumns: TableColumn<TimecardException>[] = [
  {
    key: 'type',
    header: 'Exception',
    accessor: (exception) => (
      <div className="min-w-52">
        <p className="font-semibold text-[var(--text-primary)]">{formatStatus(exception.exception_type)}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{exception.reason}</p>
      </div>
    ),
  },
  {
    key: 'severity',
    header: 'Severity',
    accessor: (exception) => <Badge variant={exception.severity === 'high' ? 'danger' : exception.severity === 'medium' ? 'warning' : 'neutral'}>{formatStatus(exception.severity)}</Badge>,
  },
  {
    key: 'resolved',
    header: 'State',
    accessor: (exception) => <Badge variant={exception.resolved ? 'success' : 'warning'}>{exception.resolved ? 'Resolved' : 'Open'}</Badge>,
  },
  { key: 'created', header: 'Created', accessor: (exception) => formatDateTime(exception.created_at) },
];

export const EmployeeTimesheetReview = () => {
  const { timecardId } = useParams<{ timecardId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ReviewTab>('merged');
  const [localTimecard, setLocalTimecard] = useState<TimecardEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [regHours, setRegHours] = useState('');
  const [otHours, setOtHours] = useState('');
  const [dtHours, setDtHours] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [formError, setFormError] = useState('');
  const routeState = location.state as EmployeeReviewLocationState | null;
  const returnTo = routeState?.returnTo || '/reviewer/timesheets';

  const timecardQuery = useTimecard(timecardId);
  const underReviewQuery = useUnderReviewTimesheets();
  const processedQuery = useProcessedTimesheets();
  const { mutate: approveTimecard, isPending: isApproving } = useApproveTimecard();
  const { mutate: rejectTimecard, isPending: isRejecting } = useRejectTimecard();
  const { mutate: resolveTimecard, isPending: isResolving } = useResolveTimecard();

  const routeTimecard = routeState?.timecard;
  const stateTimecard = routeTimecard?.timecard_id === timecardId ? routeTimecard : undefined;
  const stateTimesheet = routeState?.timesheet;
  const timecard = localTimecard?.timecard_id === timecardId ? localTimecard : timecardQuery.data ?? stateTimecard;

  const lookupTimesheets = useMemo(() => {
    return [...(underReviewQuery.data ?? []), ...(processedQuery.data ?? [])];
  }, [processedQuery.data, underReviewQuery.data]);

  const timesheet = stateTimesheet?.timesheet_id === timecard?.timesheet_id
    ? stateTimesheet
    : lookupTimesheets.find((item) => item.timesheet_id === timecard?.timesheet_id);

  const attachmentInfoQuery = useAttachmentInfo(timesheet?.email_id);
  const ruleQuery = useClientRule(timecard?.rule_id ?? undefined);
  const employeeQuery = useEmployee(timecard?.emp_id ?? undefined);

  const employeeRecord = useMemo(() => {
    const employeeRecords = getEmployeeRecords(timesheet?.payload);
    return employeeRecords.find((employee) => {
      if (timecard?.emp_id && employee.emp_id === timecard.emp_id) return true;
      if (timecard?.assignment_id && employee.assignment_id === timecard.assignment_id) return true;
      return normalize(employee.employee_name) === normalize(timecard?.employee_name)
        || normalize(employee.extracted_employee_name) === normalize(timecard?.employee_name);
    });
  }, [timecard?.assignment_id, timecard?.employee_name, timecard?.emp_id, timesheet?.payload]);

  const sources = useMemo(() => {
    return buildSourceViews(employeeRecord, attachmentInfoQuery.data ?? []);
  }, [attachmentInfoQuery.data, employeeRecord]);

  const actualClientId = employeeQuery.data?.clientId ?? ruleQuery.data?.client_id ?? null;
  const actualDepartmentId = employeeQuery.data?.departmentId ?? ruleQuery.data?.department_id ?? null;
  const actualClientQuery = useClient(actualClientId ?? undefined);
  const actualDepartmentsQuery = useDepartmentsByClient(actualClientId ?? '');
  const actualDepartment = (actualDepartmentsQuery.data ?? []).find((department) => department.department_id === actualDepartmentId);
  const extractedEmployeeName = employeeRecord?.extracted_employee_name || employeeRecord?.employee_name || timecard?.employee_name || null;
  const actualEmployeeName = employeeRecord?.employee_name || timecard?.employee_name || employeeQuery.data?.name || null;
  const employeeMatchingScore = employeeRecord?.employee_matching_score ?? employeeRecord?.matching_score ?? null;
  const extractedClientName = employeeRecord?.extracted_client_name || timesheet?.client_name || null;
  const extractedDepartmentName = employeeRecord?.extracted_department_name || employeeRecord?.department || null;
  const actualClientName = actualClientQuery.data?.client_name || null;
  const actualDepartmentName = actualDepartment?.department_name || null;
  const isActualAssignmentLoading = employeeQuery.isLoading || actualClientQuery.isLoading || actualDepartmentsQuery.isLoading;

  const records = employeeRecord?.timesheet_records ?? [];
  const employeeTotalHours = stringifyValue(employeeRecord?.total_hours);
  const hasExceptions = Boolean(timecard?.exceptions?.length);
  const hasOpenExceptions = timecard ? hasUnresolvedExceptions(timecard) : false;
  const isActionFinal = timecard ? isFinalTimecardStatus(timecard.status) : false;
  const isReviewActionPending = isApproving || isRejecting;
  const isLoading = !timecard && (timecardQuery.isLoading || underReviewQuery.isLoading || processedQuery.isLoading);
  const error = timecardQuery.error || underReviewQuery.error || processedQuery.error;

  useEffect(() => {
    if (!timecard) return;
    setEmployeeName(timecard.employee_name || '');
    setRegHours(formatHours(timecard.reg_hours));
    setOtHours(formatHours(timecard.ot_hours));
    setDtHours(formatHours(timecard.dt_hours));
    setReviewComment(timecard.review_comment || '');
    setFormError('');
  }, [timecard]);

  const parseHours = (value: string) => {
    const numericValue = Number(value.trim());
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
  };

  const handleResolveSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!timecard) return;

    const parsedReg = parseHours(regHours);
    const parsedOt = parseHours(otHours);
    const parsedDt = parseHours(dtHours);
    if (parsedReg === null || parsedOt === null || parsedDt === null) {
      setFormError('Regular, OT, and DT hours must be non-negative numbers.');
      return;
    }
    if (!reviewComment.trim()) {
      setFormError('Add a reviewer comment before resolving this exception.');
      return;
    }

    resolveTimecard(
      {
        timecardId: timecard.timecard_id,
        payload: {
          employee_name: employeeName.trim() || null,
          reg_hours: parsedReg,
          ot_hours: parsedOt,
          dt_hours: parsedDt,
          review_comment: reviewComment.trim(),
        },
      },
      {
        onSuccess: (updated) => {
          setLocalTimecard(updated);
          toast.success('Exception resolved and timecard updated.', 'Resolved');
          setIsEditorOpen(false);
        },
        onError: (requestError) => toast.error(requestError.message, 'Resolve failed'),
      },
    );
  };

  const approveCurrent = () => {
    if (!timecard || isActionFinal || hasOpenExceptions) return;
    approveTimecard(timecard.timecard_id, {
      onSuccess: (updated) => {
        setLocalTimecard(updated);
        toast.success('Employee timecard approved.', 'Approved');
      },
      onError: (requestError) => toast.error(requestError.message, 'Approve failed'),
    });
  };

  const rejectCurrent = () => {
    if (!timecard || isActionFinal) return;
    rejectTimecard(timecard.timecard_id, {
      onSuccess: (updated) => {
        setLocalTimecard(updated);
        toast.success('Employee timecard rejected.', 'Rejected');
      },
      onError: (requestError) => toast.error(requestError.message, 'Reject failed'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading employee timesheet...</p>
        </div>
      </div>
    );
  }

  if (!timecard) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">Employee timesheet unavailable</h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          {error?.message || 'The selected employee timecard could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate(returnTo)}>
          Back to Timesheets
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
          Timecards
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="h-4 w-4" />}
            isLoading={isApproving}
            disabled={isActionFinal || hasOpenExceptions || isReviewActionPending}
            onClick={approveCurrent}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<XCircle className="h-4 w-4" />}
            isLoading={isRejecting}
            disabled={isActionFinal || isReviewActionPending}
            onClick={rejectCurrent}
          >
            Reject
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <UserRound className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {timecard.employee_name || 'Unknown employee'}
                  </h1>
                  <Badge variant={getStatusVariant(timecard.status)}>{formatStatus(timecard.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {timesheet?.client_name || 'Client not available'} / {employeeRecord?.department || 'Department not available'}
                </p>
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                  <span className="shrink-0 font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sources</span>
                  {sources.length === 0 ? (
                    <span className="text-[var(--text-muted)]"></span>
                  ) : (
                    sources.map((source) => (
                      source.sourceType === 'email' ? (
                        <button
                          key={source.key}
                          type="button"
                          className="inline-flex max-w-48 items-center gap-1.5 rounded-md border border-[var(--border-color)] bg-white px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          title={source.fileName}
                          onClick={() => navigate(`/reviewer/emails/${timesheet?.email_id}`)}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                          <span className="truncate">{source.fileName}</span>
                        </button>
                      ) : source.attachmentUrl ? (
                        <button
                          key={source.key}
                          type="button"
                          className="inline-flex max-w-48 items-center gap-1.5 rounded-md border border-[var(--border-color)] bg-white px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          title={source.fileName}
                          onClick={() => openAttachmentInNewTab(source.attachmentUrl!)}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                          <span className="truncate">{source.fileName}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </button>
                      ) : (
                        <span
                          key={source.key}
                          className="inline-flex max-w-48 items-center gap-1.5 rounded-md border border-[var(--border-color)] bg-white px-2 py-1 text-xs font-medium text-[var(--text-secondary)]"
                          title={source.fileName}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                          <span className="truncate">{source.fileName}</span>
                        </span>
                      )
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Week ending</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatDate(timecard.week_ending)}</p>
              </div>
            </div>
          </div>
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Reg</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{formatHours(timecard.reg_hours)}</p>
          </div>
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">OT</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{formatHours(timecard.ot_hours)}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">DT</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{formatHours(timecard.dt_hours)}</p>
          </div>
        </div>
      </section>

      <div className="inline-flex w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-1 sm:w-auto">
        {([
          ['merged', 'Merged Details'],
          ['rules', 'Rules'],
          ...(hasExceptions ? [['exceptions', 'Exceptions']] : []),
        ] as [ReviewTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ' + (activeTab === tab ? 'bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'merged' && (
        <section className="space-y-4">
          <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm shadow-gray-950/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Merged Extracted Timesheet Details</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Employee-level rows from the merged extraction payload.</p>
              </div>
              <Badge variant="info">{records.length} rows</Badge>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm shadow-gray-950/5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Extracted employee</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatDetailValue(extractedEmployeeName)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Extracted client</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatDetailValue(extractedClientName)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Extracted department</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatDetailValue(extractedDepartmentName)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Actual employee</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatDetailValue(actualEmployeeName)}</p>
                    <Badge variant="info">Match {formatMatchingScore(employeeMatchingScore)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Actual assigned client</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{isActualAssignmentLoading ? 'Loading...' : formatDetailValue(actualClientName)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Actual assigned department</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{isActualAssignmentLoading ? 'Loading...' : formatDetailValue(actualDepartmentName)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm shadow-gray-950/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Employee total hours</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{employeeTotalHours}</p>
            </div>
          </div>

          <Table
            data={records}
            columns={recordColumns}
            emptyMessage="No merged extracted rows were found for this employee."
          />
        </section>
      )}

      {activeTab === 'rules' && (
        <section className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
          <div className="border-b border-[var(--border-color)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Applied Rules</h2>
          </div>
          <div className="p-5">
            {!timecard.rule_id ? (
              <p className="text-sm text-[var(--text-muted)]">No client rule is attached to this employee timecard.</p>
            ) : ruleQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Spinner size="sm" />Loading applied rule...</div>
            ) : ruleQuery.error ? (
              <p className="text-sm text-[var(--danger-text)]">{ruleQuery.error.message}</p>
            ) : ruleQuery.data ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-[var(--primary)]" />
                  {ruleQuery.data.is_active && <Badge variant="success"><BadgeCheck className="mr-1 h-3 w-3" />Active</Badge>}
                  <Badge variant={ruleQuery.data.break_auto_deduct ? 'info' : 'neutral'}>{ruleQuery.data.break_auto_deduct ? 'Auto break' : 'Manual break'}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Weekly OT</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleHours(ruleQuery.data.weekly_ot_threshold)}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Weekly DT</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleHours(ruleQuery.data.weekly_dt_threshold)}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Multipliers</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleMultiplier(ruleQuery.data.ot_multiplier)} / {formatRuleMultiplier(ruleQuery.data.dt_multiplier)}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Break</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleHours(ruleQuery.data.break_deduction_hrs)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">The applied rule could not be found.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'exceptions' && hasExceptions && (
        <section className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-[var(--warning-bg)] px-5 py-4 shadow-sm shadow-gray-950/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[var(--warning-text)]">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-base font-semibold">Exception Details</h2>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Edit3 className="h-4 w-4" />}
                disabled={!hasOpenExceptions || isActionFinal || isResolving}
                title={hasOpenExceptions ? 'Edit timecard' : 'All exceptions resolved'}
                onClick={() => {
                  if (hasOpenExceptions && !isActionFinal) setIsEditorOpen(true);
                }}
              >
                Edit Timecard
              </Button>
            </div>
          </div>
          <Table
            data={timecard.exceptions}
            columns={exceptionColumns}
            emptyMessage="No exceptions are attached to this employee timecard."
          />
        </section>
      )}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="Edit Timecard"
        size="lg"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-5">
          <Input
            label="Employee name"
            value={employeeName}
            onChange={(event) => setEmployeeName(event.target.value)}
            disabled={isResolving}
            fullWidth
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Regular hours" type="number" min="0" step="0.01" value={regHours} onChange={(event) => setRegHours(event.target.value)} disabled={isResolving} fullWidth />
            <Input label="OT hours" type="number" min="0" step="0.01" value={otHours} onChange={(event) => setOtHours(event.target.value)} disabled={isResolving} fullWidth />
            <Input label="DT hours" type="number" min="0" step="0.01" value={dtHours} onChange={(event) => setDtHours(event.target.value)} disabled={isResolving} fullWidth />
          </div>
          <Textarea
            label="Reviewer comment"
            value={reviewComment}
            onChange={(event) => {
              setReviewComment(event.target.value);
              if (formError) setFormError('');
            }}
            error={formError}
            disabled={isResolving}
            rows={4}
            fullWidth
          />
          <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
            <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} disabled={isResolving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isResolving} icon={<CheckCircle2 className="h-4 w-4" />}>
              Submit Updates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};




















