import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  ReceiptText,
  Rows3,
  Users,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { TimecardTable } from './TimecardTable';
import { useAttachmentInfo } from '../../Emails/hooks/useAttachmentInfo';
import type { AttachmentInfo } from '../../Emails/types';
import { useClients } from '../../Client/hooks/useClients';
import { useClientRulesByDepartment } from '../../ClientRules/hooks/useClientRules';
import type { ClientRuleNumber, ClientRuleResponse } from '../../ClientRules/types';
import { useDepartmentsByClient } from '../../Department/hooks/useDepartments';
import type { DepartmentResponse } from '../../Department/types';
import {
  useMarkTimesheetProcessed,
  useProcessedTimesheets,
  useUnderReviewTimesheets,
} from '../hooks/useTimesheets';
import type {
  EmployeeRecord,
  MergeResponse,
  Timesheet,
  TimesheetExtractedPayload,
  TimesheetPayloadRow,
  TimesheetRecord,
  TimesheetSheetPayload,
} from '../types';

interface TimesheetLocationState {
  timesheet?: Timesheet;
}

type DetailTab = 'timecard' | 'merged' | 'clientRules';

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

const formatLabel = (key: string) => {
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

const getAttachmentUrlForFile = (fileName: string, attachmentUrlByName: Map<string, string>) => {
  return attachmentUrlByName.get(normalizeAttachmentName(fileName));
};

const openAttachmentInNewTab = (attachmentUrl: string) => {
  window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
};

const isMergeResponse = (payload: TimesheetExtractedPayload | null | undefined): payload is MergeResponse => {
  return isObjectRecord(payload) && ('global_data' in payload || 'employee_records' in payload);
};

const getRowsFromSheet = (payload: TimesheetSheetPayload): TimesheetPayloadRow[] => {
  if (Array.isArray(payload.rows)) return payload.rows;
  if (!Array.isArray(payload.blocks)) return [];

  return payload.blocks.flatMap((block) => {
    const rows = block.extraction?.rows;
    return Array.isArray(rows) ? rows : [];
  });
};

const getEmployeeRecords = (payload: TimesheetExtractedPayload | null | undefined): EmployeeRecord[] => {
  if (!isMergeResponse(payload)) return [];
  return Array.isArray(payload.employee_records) ? payload.employee_records : [];
};

const getRowsFromPayload = (payload: TimesheetExtractedPayload | null | undefined): TimesheetPayloadRow[] => {
  if (!payload) return [];

  if (isMergeResponse(payload)) {
    return getEmployeeRecords(payload).flatMap((employee) => {
      const records = Array.isArray(employee.timesheet_records) ? employee.timesheet_records : [];
      const sourceFiles = (employee.source ?? [])
        .map((source) => source.file_name)
        .filter(Boolean)
        .join(', ');

      return records.map((record) => ({
        employee_name: employee.employee_name,
        department: employee.department,
        source_files: sourceFiles || undefined,
        ...record,
      }));
    });
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((sheet) => getRowsFromSheet(sheet));
  }

  return getRowsFromSheet(payload);
};

const getGlobalEntries = (payload: TimesheetExtractedPayload | null | undefined, timesheet: Timesheet) => {
  const globalData = isMergeResponse(payload) && isObjectRecord(payload.global_data) ? payload.global_data : {};
  const entries = Object.entries(globalData).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const existingKeys = new Set(entries.map(([key]) => key));

  if (!existingKeys.has('client_name')) entries.unshift(['client_name', timesheet.client_name]);
  if (!existingKeys.has('week_ending')) entries.push(['week_ending', timesheet.week_ending]);

  return entries;
};

const getSourceCount = (employees: EmployeeRecord[]) => {
  return employees.reduce((count, employee) => count + (employee.source?.length ?? 0), 0);
};

const formatConfidence = (value: TimesheetRecord['confidence']) => {
  if (value === null || value === undefined || value === '') return '';

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);

  if (numericValue >= 0 && numericValue <= 1) {
    return Math.round(numericValue * 100) + '%';
  }

  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
};


const normalizeName = (value: string | null | undefined) => {
  return (value ?? '').trim().toLowerCase();
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

const sortRules = (rules: ClientRuleResponse[]) => {
  return [...rules].sort((first, second) => Number(second.is_active) - Number(first.is_active));
};

interface ClientRuleAccordionItemProps {
  department: DepartmentResponse;
}

const ClientRuleAccordionItem = ({ department }: ClientRuleAccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: rules = [], error, isLoading } = useClientRulesByDepartment(department.department_id);
  const sortedRules = useMemo(() => sortRules(rules), [rules]);

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-card-soft)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            <ReceiptText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {department.department_name}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">
              {department.department_id}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={isLoading ? 'neutral' : rules.length ? 'success' : 'neutral'}>
            {isLoading ? 'Loading' : rules.length + ' rule' + (rules.length === 1 ? '' : 's')}
          </Badge>
          <ChevronDown
            className={
              'h-4 w-4 text-[var(--text-muted)] transition-transform ' +
              (isOpen ? 'rotate-180' : '')
            }
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-card-soft)] p-3">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" />
              Loading client rules...
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]">
              {error.message}
            </div>
          ) : sortedRules.length === 0 ? (
            <div className="rounded-md border border-dashed border-[var(--border-color)] bg-white px-3 py-3 text-sm text-[var(--text-muted)]">
              No client rules configured for this department.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRules.map((rule) => (
                <div
                  key={rule.rule_id}
                  className="rounded-md border border-[var(--border-color)] bg-white p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                        {rule.rule_id}
                      </p>
                      {rule.is_active && (
                        <Badge variant="success">
                          <span className="inline-flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" /> Active
                          </span>
                        </Badge>
                      )}
                    </div>
                    <Badge variant={rule.break_auto_deduct ? 'info' : 'neutral'}>
                      {rule.break_auto_deduct ? 'Auto break' : 'Manual break'}
                    </Badge>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md bg-[var(--bg-card-soft)] px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Weekly OT</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleHours(rule.weekly_ot_threshold)}</p>
                    </div>
                    <div className="rounded-md bg-[var(--bg-card-soft)] px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Weekly DT</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleHours(rule.weekly_dt_threshold)}</p>
                    </div>
                    <div className="rounded-md bg-[var(--bg-card-soft)] px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Multipliers</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleMultiplier(rule.ot_multiplier)} / {formatRuleMultiplier(rule.dt_multiplier)}</p>
                    </div>
                    <div className="rounded-md bg-[var(--bg-card-soft)] px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Break</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatRuleHours(rule.break_deduction_hrs)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const employeeRecordColumns: TableColumn<TimesheetRecord>[] = [
  {
    key: 'date',
    header: 'Date',
    accessor: (record) => stringifyValue(record.date),
  },
  {
    key: 'check_in',
    header: 'Check In',
    accessor: (record) => stringifyValue(record.check_in),
  },
  {
    key: 'check_out',
    header: 'Check Out',
    accessor: (record) => stringifyValue(record.check_out),
  },
  {
    key: 'break_hour',
    header: 'Break',
    accessor: (record) => stringifyValue(record.break_hour),
  },
  {
    key: 'hours',
    header: 'Hours',
    accessor: (record) => stringifyValue(record.hours),
  },

  {
    key: 'overtime_hours',
    header: 'Overtime',
    accessor: (record) => stringifyValue(record.overtime_hours),
  },
  {
    key: 'confidence',
    header: 'Confidence',
    accessor: (record) => (
      <Badge variant="info">{formatConfidence(record.confidence)}</Badge>
    ),
  },
];

export const TimesheetDetails = () => {
  const [activeTab, setActiveTab] = useState<DetailTab>('timecard');
  const [updatedTimesheet, setUpdatedTimesheet] = useState<Timesheet | null>(null);
  const { timesheetId } = useParams<{ timesheetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const markProcessedMutation = useMarkTimesheetProcessed();
  const routeState = location.state as TimesheetLocationState | null;
  const routeStateTimesheet = routeState?.timesheet;
  const stateTimesheet = routeStateTimesheet?.timesheet_id === timesheetId ? routeStateTimesheet : undefined;
  const shouldLookup = !stateTimesheet;

  const underReviewQuery = useUnderReviewTimesheets();
  const processedQuery = useProcessedTimesheets();

  const lookupTimesheets = useMemo(() => {
    return [...(underReviewQuery.data ?? []), ...(processedQuery.data ?? [])];
  }, [processedQuery.data, underReviewQuery.data]);

  const lookupTimesheet = stateTimesheet || lookupTimesheets.find((item) => item.timesheet_id === timesheetId);
  const timesheet = updatedTimesheet?.timesheet_id === timesheetId ? updatedTimesheet : lookupTimesheet;
  const clientsQuery = useClients();
  const matchedClient = useMemo(() => {
    const timesheetClientName = normalizeName(timesheet?.client_name);
    if (!timesheetClientName) return undefined;
    return (clientsQuery.data ?? []).find(
      (client) => normalizeName(client.client_name) === timesheetClientName,
    );
  }, [clientsQuery.data, timesheet?.client_name]);
  const departmentsQuery = useDepartmentsByClient(matchedClient?.client_id ?? '');
  const attachmentInfoQuery = useAttachmentInfo(timesheet?.email_id);
  const attachmentUrlByName = useMemo(
    () => buildAttachmentUrlByName(attachmentInfoQuery.data ?? []),
    [attachmentInfoQuery.data],
  );
  const isLoading = shouldLookup && (underReviewQuery.isLoading || processedQuery.isLoading);
  const lookupError = underReviewQuery.error || processedQuery.error;

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading timesheet details...</p>
        </div>
      </div>
    );
  }

  if (!timesheet) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">
          Timesheet unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          {lookupError?.message || 'The selected timesheet could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate('/reviewer/timesheets')}>
          Back to Timesheets
        </Button>
      </div>
    );
  }

  const isProcessed = timesheet.status === 'processed';
  const handleMarkProcessed = () => {
    markProcessedMutation.mutate(timesheet.timesheet_id, {
      onSuccess: (updated) => {
        setUpdatedTimesheet(updated);
        toast.success('Timesheet marked as processed.');
      },
      onError: (error) => {
        toast.error(error.message || 'Unable to update timesheet status.');
      },
    });
  };

  const payload = timesheet.payload;
  const rows = getRowsFromPayload(payload);
  const employeeRecords = getEmployeeRecords(payload);
  const globalEntries = getGlobalEntries(payload, timesheet);
  const sourceCount = getSourceCount(employeeRecords);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/reviewer/timesheets')}
        >
          Timesheets
        </Button>

        {!isProcessed && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={markProcessedMutation.isPending}
            disabled={markProcessedMutation.isPending}
            onClick={handleMarkProcessed}
          >
            Update status to processed
          </Button>
        )}
      </div>
      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <FileText className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {timesheet.client_name || 'Needs client match'}
                  </h1>
                  <Badge variant={getStatusVariant(timesheet.status)}>
                    {getStatusLabel(timesheet.status)}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-sm text-[var(--text-muted)]">
                  {timesheet.email_id}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Timesheet ID
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">
                {timesheet.timesheet_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Client
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {timesheet.client_name || 'Not matched'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Week ending
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(timesheet.week_ending)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-card-soft)] text-[var(--text-secondary)]">
                <Rows3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Timecard rows
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {rows.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="inline-flex w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => setActiveTab('timecard')}
          className={
            'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ' +
            (activeTab === 'timecard'
              ? 'bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-color)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
          }
        >
          Timecard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('merged')}
          className={
            'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ' +
            (activeTab === 'merged'
              ? 'bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-color)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
          }
        >
          Merged Data
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clientRules')}
          className={
            'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ' +
            (activeTab === 'clientRules'
              ? 'bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-color)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
          }
        >
          Client Rules
        </button>
      </div>

      {activeTab === 'timecard' ? (
        <section className="space-y-4">
          {/* <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
            <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Timecard Data</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Flattened merged rows for the selected timesheet.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)]">
                <ShieldCheck className="h-4 w-4 text-[var(--success-text)]" />
                {rows.length} rows
              </div>
            </div>
          </div> */}
          <TimecardTable timesheetId={timesheet.timesheet_id} />

          {/* <Table
            data={rows}
            columns={rowColumns}
            emptyMessage="No merged timecard rows are available for this timesheet."
          /> */}
        </section>
      ) : activeTab === 'clientRules' ? (
        <section className="space-y-3">
          <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm shadow-gray-950/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Client Rules</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Departments and pay rules configured for {timesheet.client_name || 'this client'}.
                </p>
              </div>
              {matchedClient && (
                <Badge variant="info">{departmentsQuery.data?.length ?? 0} departments</Badge>
              )}
            </div>
          </div>

          {clientsQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-white px-5 py-5 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" />
              Loading client details...
            </div>
          ) : clientsQuery.error ? (
            <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-5 py-4 text-sm text-[var(--danger-text)]">
              {clientsQuery.error.message}
            </div>
          ) : !timesheet.client_name ? (
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-5 text-sm text-[var(--text-muted)]">
              This timesheet does not have a matched client.
            </div>
          ) : !matchedClient ? (
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-5 text-sm text-[var(--text-muted)]">
              No active client record matched {timesheet.client_name}.
            </div>
          ) : departmentsQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-white px-5 py-5 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" />
              Loading departments...
            </div>
          ) : departmentsQuery.error ? (
            <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-5 py-4 text-sm text-[var(--danger-text)]">
              {departmentsQuery.error.message}
            </div>
          ) : (departmentsQuery.data ?? []).length === 0 ? (
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-5 py-5 text-sm text-[var(--text-muted)]">
              No departments are configured for this client.
            </div>
          ) : (
            (departmentsQuery.data ?? []).map((department) => (
              <ClientRuleAccordionItem
                key={department.department_id}
                department={department}
              />
            ))
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
            <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Merged Timesheet Data</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Employee records generated from the timesheet merge result.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2">
                  <p className="text-base font-semibold text-[var(--text-primary)]">{employeeRecords.length}</p>
                  <p className="text-xs text-[var(--text-muted)]">Employees</p>
                </div>
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2">
                  <p className="text-base font-semibold text-[var(--text-primary)]">{sourceCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Sources</p>
                </div>
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2">
                  <p className="text-base font-semibold text-[var(--text-primary)]">{rows.length}</p>
                  <p className="text-xs text-[var(--text-muted)]">Rows</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
              {globalEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--primary)] ring-1 ring-[var(--border-color)]">
                    {key.includes('client') ? <BriefcaseBusiness className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {formatLabel(key)}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">
                    {key.includes('week') || key.includes('date') ? formatDate(stringifyValue(value)) : stringifyValue(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {employeeRecords.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-color)] bg-white p-10 text-center shadow-sm shadow-gray-950/5">
              <Database className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">No merged employee records</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                The timesheet does not contain merged employee data yet.
              </p>
            </div>
          ) : (
            employeeRecords.map((employee, employeeIndex) => {
              const records = employee.timesheet_records ?? [];
              const sources = employee.source ?? [];
              const total_hours=employee.total_hours??'0';

              return (
                <section
                  key={employee.employee_name + '-' + employeeIndex}
                  className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5"
                >
                  <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-blue-100">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">
                            {employee.employee_name || 'Unnamed employee'}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="neutral">{employee.department || 'No department'}</Badge>
                            <Badge variant="neutral">total hours: {total_hours || '0'} hours</Badge>
                            <Badge variant="info">{records.length} records</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex max-w-3xl flex-wrap gap-2">
                        {sources.length === 0 ? (
                          <Badge variant="neutral">No source files</Badge>
                        ) : (
                          sources.map((source, sourceIndex) => {
                            const attachmentUrl = getAttachmentUrlForFile(source.file_name, attachmentUrlByName);
                            const sourceContent = (
                              <>
                                <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                                <span className="truncate">{source.file_name}</span>
                                <span className="shrink-0 text-[var(--text-muted)]">{source.content_type}</span>
                                {attachmentUrl && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />}
                              </>
                            );

                            return attachmentUrl ? (
                              <a
                                key={source.file_name + '-' + sourceIndex}
                                href={attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => {
                                  event.preventDefault();
                                  openAttachmentInNewTab(attachmentUrl);
                                }}
                                className="inline-flex max-w-xs items-center gap-2 rounded-full border border-[var(--border-color)] bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                aria-label={'Open attachment ' + source.file_name}
                              >
                                {sourceContent}
                              </a>
                            ) : (
                              <span
                                key={source.file_name + '-' + sourceIndex}
                                className="inline-flex max-w-xs items-center gap-2 rounded-full border border-[var(--border-color)] bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                              >
                                {sourceContent}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                      <Clock3 className="h-4 w-4 text-[var(--success-text)]" />
                      Timesheet records
                    </div>
                    <Table
                      data={records}
                      columns={employeeRecordColumns}
                      emptyMessage="No records are available for this employee."
                    />
                  </div>
                </section>
              );
            })
          )}
        </section>
      )}
    </div>
  );
};
