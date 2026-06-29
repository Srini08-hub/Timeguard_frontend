import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
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
    'total_hours',
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
      <span className="block max-w-56 truncate text-sm text-gray-700 dark:text-gray-300">
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
  const stateExtract = routeState?.extract;
  const extract = stateExtract || contentExtractsQuery.data?.[Number.isNaN(parsedExtractIndex) ? 0 : parsedExtractIndex];
  const sheets = normalizePayloadToSheets(extract?.extracted_payload, extract);
  const totalRows = sheets.reduce((count, sheet) => count + sheet.rows.length, 0);
  const totalGlobalFields = sheets.reduce((count, sheet) => count + sheet.globalData.length, 0);

  const isLoading = (!timesheet && (underReviewQuery.isLoading || processedQuery.isLoading)) ||
    (Boolean(timesheet) && !stateExtract && contentExtractsQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading extracted payload...</p>
        </div>
      </div>
    );
  }

  if (!timesheet || !extract) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/70 p-8 text-center dark:border-red-950/40 dark:bg-red-950/15">
        <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">
          Extracted payload unavailable
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
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

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                    {extract.attachment_name || 'email_body'}
                  </h1>
                  <Badge variant={sheets.length > 0 ? 'success' : 'neutral'}>
                    {sheets.length > 0 ? 'Payload Available' : 'No Payload'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {timesheet.client_name || 'Needs client match'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Email ID
              </p>
              <p className="mt-1 font-mono text-sm text-gray-950 dark:text-white">
                {timesheet.email_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Source type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {extract.source_type}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Sheets
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {sheets.length}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
                <Rows3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Extracted rows
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {totalRows}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Global fields
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {totalGlobalFields}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {sheets.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" />
          <h2 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">No sheet data found</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This extracted payload does not contain sheet rows or global fields.
          </p>
        </div>
      ) : (
        sheets.map((sheet, index) => {
          const rowColumns = buildRowColumns(sheet.rows);

          return (
            <section key={sheet.id} className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                        {sheet.title}
                      </h2>
                      <Badge variant="info">Sheet {index + 1}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Sheet-level globals, employee summary, and extracted time rows.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      {sheet.globalData.length} global fields
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                      <Rows3 className="h-4 w-4 text-blue-500" />
                      {sheet.rows.length} rows
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {sheet.globalData.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No global fields were detected for this sheet.</p>
                  ) : (
                    sheet.globalData.map((item) => (
                      <div key={sheet.id + item.label + item.value} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {item.label}
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-gray-950 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              
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


