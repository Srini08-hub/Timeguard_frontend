import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Inbox,
  Rows3,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useAttachmentInfo } from '../../Emails/hooks/useAttachmentInfo';
import type { AttachmentInfo } from '../../Emails/types';
import {
  useProcessedTimesheets,
  useTimesheetContentExtracts,
  useUnderReviewTimesheets,
} from '../hooks/useTimesheets';
import type {
  ContentExtract,
  Timesheet,
  TimesheetExtractedPayload,
  TimesheetPayloadRow,
  TimesheetSheetPayload,
} from '../types';

interface ExtractLocationState {
  timesheet?: Timesheet;
  extract?: ContentExtract;
  extractIndex?: number;
}

interface GlobalField {
  label: string;
  value: string;
}

interface SheetView {
  id: string;
  title: string;
  rows: TimesheetPayloadRow[];
  globalData: GlobalField[];
  employeesMeta: TimesheetPayloadRow[];
}

interface EmployeeSourceView {
  key: string;
  employeeName: string;
  fileName: string;
  sourceType: string;
  attachmentUrl?: string;
}

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
};

const formatLabel = (key: string) => {
  return key.replaceAll('_', ' ');
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const getTextValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
};

const getFirstTextField = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = getTextValue(record[key]);
    if (value) return value;
  }

  return '';
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

const getSourceFromRecord = (
  source: Record<string, unknown>,
  employeeName: string,
  sourceIndex: number,
  attachmentUrlByName: Map<string, string>,
): EmployeeSourceView | null => {
  const fileName = getFirstTextField(source, ['file_name', 'filename', 'attachment_name', 'name']);
  if (!fileName) return null;

  const sourceType = getFirstTextField(source, ['content_type', 'source_type', 'document_type', 'type']);

  return {
    key: employeeName + '-' + fileName + '-' + sourceIndex,
    employeeName,
    fileName,
    sourceType: sourceType || 'Not available',
    attachmentUrl: getAttachmentUrlForFile(fileName, attachmentUrlByName),
  };
};

const buildEmployeeSources = (
  employeesMeta: TimesheetPayloadRow[],
  attachmentUrlByName: Map<string, string>,
): EmployeeSourceView[] => {
  return employeesMeta.flatMap((employee, employeeIndex) => {
    const employeeName = getFirstTextField(employee, ['employee_name', 'employee', 'name']) || 'Employee ' + (employeeIndex + 1);
    const sourceValue = employee.source ?? employee.sources;

    if (Array.isArray(sourceValue)) {
      return sourceValue
        .map((source, sourceIndex) => (
          isRecord(source)
            ? getSourceFromRecord(source, employeeName, sourceIndex, attachmentUrlByName)
            : null
        ))
        .filter((source): source is EmployeeSourceView => Boolean(source));
    }

    const fileName = getFirstTextField(employee, ['file_name', 'filename', 'attachment_name']);
    if (!fileName) return [];

    const sourceType = getFirstTextField(employee, ['content_type', 'source_type', 'document_type']);

    return [{
      key: employeeName + '-' + fileName + '-' + employeeIndex,
      employeeName,
      fileName,
      sourceType: sourceType || 'Not available',
      attachmentUrl: getAttachmentUrlForFile(fileName, attachmentUrlByName),
    }];
  });
};

const getRowsFromBlocks = (sheet: TimesheetSheetPayload): TimesheetPayloadRow[] => {
  if (!Array.isArray(sheet.blocks)) return [];

  return sheet.blocks.flatMap((block) => {
    const rows = block.extraction?.rows;
    return Array.isArray(rows) ? rows : [];
  });
};

const getRowsFromSheet = (sheet: TimesheetSheetPayload): TimesheetPayloadRow[] => {
  if (Array.isArray(sheet.rows)) return sheet.rows;
  return getRowsFromBlocks(sheet);
};

const buildGlobalData = (sheet: TimesheetSheetPayload, extract?: ContentExtract): GlobalField[] => {
  const fields: GlobalField[] = [];

  if (extract) {
    fields.push({ label: 'Attachment', value: extract.attachment_name || 'email_body' });
    fields.push({ label: 'Source Type', value: extract.source_type || 'Not available' });
  }

  if (isRecord(sheet.global_fields)) {
    Object.entries(sheet.global_fields).forEach(([key, value]) => {
      fields.push({ label: formatLabel(key), value: stringifyValue(value) });
    });
  }

  Object.entries(sheet).forEach(([key, value]) => {
    if (['rows', 'blocks', 'global_fields', 'employees_meta', 'sheet_name'].includes(key)) return;
    fields.push({ label: formatLabel(key), value: stringifyValue(value) });
  });

  if (Array.isArray(sheet.blocks)) {
    fields.push({ label: 'Blocks', value: String(sheet.blocks.length) });
    fields.push({
      label: 'Successful Blocks',
      value: String(sheet.blocks.filter((block) => block.success).length),
    });
  }

  const seen = new Set<string>();
  return fields.filter((field) => {
    const key = field.label + ':' + field.value;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getSheetTitle = (sheet: TimesheetSheetPayload, index: number) => {
  if (typeof sheet.sheet_name === 'string' && sheet.sheet_name.trim()) return sheet.sheet_name;
  if (isRecord(sheet.global_fields)) {
    const department = sheet.global_fields.department;
    if (typeof department === 'string' && department.trim()) return department;
  }
  return 'Sheet ' + (index + 1);
};

const normalizePayloadToSheets = (
  payload: TimesheetExtractedPayload | null | undefined,
  extract?: ContentExtract,
): SheetView[] => {
  if (!payload) return [];

  const sheets = Array.isArray(payload) ? payload : [payload];
  return sheets.map((sheet, index) => ({
    id: 'sheet-' + index,
    title: getSheetTitle(sheet, index),
    rows: getRowsFromSheet(sheet),
    globalData: buildGlobalData(sheet, extract),
    employeesMeta: Array.isArray(sheet.employees_meta) ? sheet.employees_meta : [],
  }));
};

const buildRowColumns = (rows: TimesheetPayloadRow[]): TableColumn<TimesheetPayloadRow>[] => {
  const preferredKeys = [
    'employee_name',
    'company',
    'department',
    'week_ending',
    'week_ending_date',
    'date',
    'in_time',
    'out_time',
  ];
  const discoveredKeys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const dayKeys = discoveredKeys.filter((key) => /\d{1,2}_[a-z]{3}/i.test(key));
  const keys = [
    ...preferredKeys.filter((key) => discoveredKeys.includes(key)),
    ...dayKeys.filter((key) => !preferredKeys.includes(key)),
    ...discoveredKeys.filter((key) => !preferredKeys.includes(key) && !dayKeys.includes(key)),
  ];

  if (keys.length === 0) {
    return [{ key: 'empty', header: 'Rows', accessor: () => 'No row fields detected' }];
  }

  return keys.map((key) => ({
    key,
    header: formatLabel(key),
    accessor: (row) => (
      <span className="block max-w-56 truncate text-sm text-[var(--text-secondary)]">
        {stringifyValue(row[key])}
      </span>
    ),
  }));
};


export const ExtractedPayloadDetails = () => {
  const { timesheetId, extractIndex } = useParams<{ timesheetId: string; extractIndex: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as ExtractLocationState | null;
  const routeStateTimesheet = routeState?.timesheet;
  const stateTimesheet = routeStateTimesheet?.timesheet_id === timesheetId ? routeStateTimesheet : undefined;
  const parsedExtractIndex = Number.parseInt(extractIndex ?? '0', 10);

  const underReviewQuery = useUnderReviewTimesheets();
  const processedQuery = useProcessedTimesheets();

  const lookupTimesheets = useMemo(() => {
    return [...(underReviewQuery.data ?? []), ...(processedQuery.data ?? [])];
  }, [processedQuery.data, underReviewQuery.data]);

  const timesheet = stateTimesheet || lookupTimesheets.find((item) => item.timesheet_id === timesheetId);
  const contentExtractsQuery = useTimesheetContentExtracts(timesheet?.email_id);
  const attachmentInfoQuery = useAttachmentInfo(timesheet?.email_id);
  const stateExtract = routeState?.extract;
  const extract = stateExtract || contentExtractsQuery.data?.[Number.isNaN(parsedExtractIndex) ? 0 : parsedExtractIndex];
  const sheets = normalizePayloadToSheets(extract?.extracted_payload, extract);
  const totalRows = sheets.reduce((count, sheet) => count + sheet.rows.length, 0);
  const totalGlobalFields = sheets.reduce((count, sheet) => count + sheet.globalData.length, 0);
  const attachmentUrlByName = useMemo(
    () => buildAttachmentUrlByName(attachmentInfoQuery.data ?? []),
    [attachmentInfoQuery.data],
  );

  const isLoading = (!timesheet && (underReviewQuery.isLoading || processedQuery.isLoading)) ||
    (Boolean(timesheet) && !stateExtract && contentExtractsQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading extracted payload...</p>
        </div>
      </div>
    );
  }

  if (!timesheet || !extract) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">
          Extracted payload unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          The selected attachment extract could not be found.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => navigate('/reviewer/timesheets')}>
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
          onClick={() => navigate('/reviewer/timesheets/' + timesheet.timesheet_id, { state: { timesheet } })}
        >
          Timesheet
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {extract.attachment_name || 'email_body'}
                  </h1>
                  <Badge variant={sheets.length > 0 ? 'success' : 'neutral'}>
                    {sheets.length > 0 ? 'Payload Available' : 'No Payload'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {timesheet.client_name || 'Needs client match'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Email ID
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">
                {timesheet.email_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Source type
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {extract.source_type}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Sheets
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {sheets.length}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Rows3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Extracted rows
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {totalRows}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-card-soft)] text-[var(--text-secondary)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Global fields
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {totalGlobalFields}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {sheets.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-color)] bg-white p-8 text-center shadow-sm shadow-gray-950/5">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">No sheet data found</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            This extracted payload does not contain sheet rows or global fields.
          </p>
        </div>
      ) : (
        sheets.map((sheet, index) => {
          const rowColumns = buildRowColumns(sheet.rows);
          const employeeSources = buildEmployeeSources(sheet.employeesMeta, attachmentUrlByName);

          return (
            <section key={sheet.id} className="space-y-4">
              <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
                <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        {sheet.title}
                      </h2>
                      <Badge variant="info">Sheet {index + 1}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Sheet-level globals, employee summary, and extracted time rows.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2 font-medium text-[var(--text-secondary)]">
                      <ShieldCheck className="h-4 w-4 text-[var(--success-text)]" />
                      {sheet.globalData.length} global fields
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2 font-medium text-[var(--text-secondary)]">
                      <Rows3 className="h-4 w-4 text-[var(--primary)]" />
                      {sheet.rows.length} rows
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {sheet.globalData.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No global fields were detected for this sheet.</p>
                  ) : (
                    sheet.globalData.map((item) => (
                      <div key={sheet.id + item.label + item.value} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          {item.label}
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-[var(--text-primary)]">
                          {item.value}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {employeeSources.length > 0 && (
                <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
                  <div className="border-b border-[var(--border-color)] px-5 py-4">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Employee sources</h3>
                  </div>
                  <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                    {employeeSources.map((source) => (
                      <div
                        key={source.key}
                        className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-4"
                      >
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {source.employeeName}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {source.attachmentUrl ? (
                            <a
                              href={source.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => {
                                event.preventDefault();
                                openAttachmentInNewTab(source.attachmentUrl);
                              }}
                              className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              aria-label={'Open attachment ' + source.fileName}
                            >
                              <FileText className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                              <span className="truncate">{source.fileName}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-secondary)]">
                              <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                              <span className="truncate">{source.fileName}</span>
                            </span>
                          )}
                          <Badge variant="neutral">{source.sourceType}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Table
                data={sheet.rows}
                columns={rowColumns}
                emptyMessage="No row-level extracted payload was found for this sheet."
              />
            </section>
          );
        })
      )}
    </div>
  );
};
