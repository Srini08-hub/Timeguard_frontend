import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import { Badge, type BadgeProps } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useToast } from '../../../hooks/useToast';
import { useClients } from '../../Client/hooks/useClients';
import { useDepartmentsByClient } from '../../Department/hooks/useDepartments';
import {
  timecardQueryKeys,
  useApprovedTimecards,
  useApproveTimecard,
  useBulkApproveTimecards,
  useBulkRejectTimecards,
  useRejectTimecard,
  useRejectedTimecards,
} from '../hooks/useTimecards';
import { useProcessedTimesheets, useUnderReviewTimesheets } from '../hooks/useTimesheets';
import timecardService from '../services/timecardService';
import type { EmployeeRecord, MergeResponse, TimecardEntry, Timesheet, TimesheetExtractedPayload } from '../types';

const ROWS_PER_PAGE = 12;

type StatusFilter = 'no_exception' | 'exception' | 'approved' | 'rejected';

type PendingTimecardAction = {
  timecardId: string;
  action: 'approve' | 'reject';
} | null;

interface ComboboxOption {
  id: string;
  label: string;
}

interface EmployeeReviewRow {
  timecard: TimecardEntry;
  timesheet?: Timesheet;
  employeeRecord?: EmployeeRecord;
  clientName: string;
  departmentName: string;
  sourceCount: number;
}

const DEFAULT_STATUS_FILTERS: StatusFilter[] = [
  'no_exception',
  'exception',
  'approved',
  'rejected',
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'no_exception', label: 'Ready for Approval' },
  { value: 'exception', label: 'Exception' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

const normalizeStatusValue = (status: string | null | undefined) => normalize(status).replace(/[\s-]+/g, '_');

const isStatusFilter = (value: string): value is StatusFilter => {
  return value === 'no_exception' || value === 'exception' || value === 'approved' || value === 'rejected';
};

const parseStatusFilters = (value: string | null): StatusFilter[] => {
  if (value === 'none') return [];
  if (!value) return [...DEFAULT_STATUS_FILTERS];

  const statuses = value.split(',').filter(isStatusFilter);
  return statuses.length > 0 ? statuses : [...DEFAULT_STATUS_FILTERS];
};

const serializeStatusFilters = (statuses: StatusFilter[]) => {
  if (statuses.length === 0) return 'none';
  return statusOptions
    .map((option) => option.value)
    .filter((status) => statuses.includes(status))
    .join(',');
};

const areDefaultStatusFilters = (statuses: StatusFilter[]) => {
  return DEFAULT_STATUS_FILTERS.length === statuses.length
    && DEFAULT_STATUS_FILTERS.every((status) => statuses.includes(status));
};

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const hasPersistedFilters = (searchParams: URLSearchParams) => {
  return Boolean(
    searchParams.get('client')
    || searchParams.get('department')
    || searchParams.get('weekEnding')
    || searchParams.get('statuses'),
  );
};

const formatHours = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return '0.00';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
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

const toDateKey = (value: string | null | undefined) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveToWeekEndingSunday = (value: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  const selectedDate = new Date(year, month - 1, day);
  const daysUntilSunday = (7 - selectedDate.getDay()) % 7;
  selectedDate.setDate(selectedDate.getDate() + daysUntilSunday);

  const resolvedYear = selectedDate.getFullYear();
  const resolvedMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const resolvedDay = String(selectedDate.getDate()).padStart(2, '0');
  return `${resolvedYear}-${resolvedMonth}-${resolvedDay}`;
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

const getStatusVariant = (status: string): NonNullable<BadgeProps['variant']> => {
  const normalizedStatus = normalizeStatusValue(status);
  if (normalizedStatus === 'no_exception' || normalizedStatus === 'clean' || normalizedStatus === 'approved') return 'success';
  if (normalizedStatus === 'exception') return 'warning';
  if (normalizedStatus === 'rejected') return 'danger';
  if (normalizedStatus === 'pending') return 'warning';
  return 'neutral';
};

const formatStatus = (status: string) => {
  const normalizedStatus = normalizeStatusValue(status);
  if (normalizedStatus === 'no_exception' || normalizedStatus === 'clean') return 'Ready for Approval';
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getRowStatus = (timecard: TimecardEntry): StatusFilter | null => {
  const normalizedStatus = normalizeStatusValue(timecard.status);
  if (normalizedStatus === 'no_exception' || normalizedStatus === 'clean') return 'no_exception';
  if (normalizedStatus === 'exception') return 'exception';
  if (normalizedStatus === 'approved') return 'approved';
  if (normalizedStatus === 'rejected') return 'rejected';
  return null;
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

const SearchableCombobox = ({
  disabled = false,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  value: string;
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.id === value);

  useEffect(() => {
    setQuery(selectedOption?.label ?? '');
  }, [selectedOption?.label]);

  const filteredOptions = useMemo(() => {
    const search = normalize(query);
    return options
      .filter((option) => !search || normalize(option.label).includes(search));
  }, [options, query]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            if (!nextQuery) onChange('');
          }}
          className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[var(--bg-card-soft)] disabled:text-[var(--text-muted)]"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[var(--border-color)] bg-white py-1 shadow-lg shadow-gray-950/10">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No matches</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.id);
                  setQuery(option.label);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.id === value && <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success-text)]" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TimesheetPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(() => searchParams.get('filters') === '1' || hasPersistedFilters(searchParams));
  const [selectedClientId, setSelectedClientId] = useState(() => searchParams.get('client') ?? '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(() => searchParams.get('department') ?? '');
  const [weekEnding, setWeekEnding] = useState(() => searchParams.get('weekEnding') ?? '');
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>(() => parseStatusFilters(searchParams.get('statuses')));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingTimecardAction>(null);
  const [finalizedActionIds, setFinalizedActionIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(() => parsePage(searchParams.get('page')));
  const hasMounted = useRef(false);

  const underReviewQuery = useUnderReviewTimesheets();
  const processedQuery = useProcessedTimesheets();
  const clientsQuery = useClients();
  const departmentsQuery = useDepartmentsByClient(selectedClientId);
  const approvedQuery = useApprovedTimecards();
  const rejectedQuery = useRejectedTimecards();
  const { mutate: approveTimecard } = useApproveTimecard();
  const { mutate: rejectTimecard } = useRejectTimecard();
  const { mutate: approveMany, isPending: isApprovingMany } = useBulkApproveTimecards();
  const { mutate: rejectMany, isPending: isRejectingMany } = useBulkRejectTimecards();

  const knownTimesheets = useMemo(() => {
    const byId = new Map<string, Timesheet>();
    [...(underReviewQuery.data ?? []), ...(processedQuery.data ?? [])].forEach((timesheet) => {
      byId.set(timesheet.timesheet_id, timesheet);
    });
    return Array.from(byId.values());
  }, [processedQuery.data, underReviewQuery.data]);

  const timesheetById = useMemo(() => {
    return new Map(knownTimesheets.map((timesheet) => [timesheet.timesheet_id, timesheet]));
  }, [knownTimesheets]);

  const timecardQueries = useQueries({
    queries: knownTimesheets.map((timesheet) => ({
      queryKey: timecardQueryKeys.byTimesheet(timesheet.timesheet_id),
      queryFn: () => timecardService.getByTimesheet(timesheet.timesheet_id),
      enabled: Boolean(timesheet.timesheet_id),
    })),
  });

  const rows = useMemo<EmployeeReviewRow[]>(() => {
    const byId = new Map<string, TimecardEntry>();

    timecardQueries.forEach((query) => {
      (query.data ?? []).forEach((timecard) => byId.set(timecard.timecard_id, timecard));
    });
    (approvedQuery.data ?? []).forEach((timecard) => byId.set(timecard.timecard_id, timecard));
    (rejectedQuery.data ?? []).forEach((timecard) => byId.set(timecard.timecard_id, timecard));

    return Array.from(byId.values()).map((timecard) => {
      const timesheet = timesheetById.get(timecard.timesheet_id);
      const employeeRecord = getEmployeeRecords(timesheet?.payload).find(
        (employee) => normalize(employee.employee_name) === normalize(timecard.employee_name),
      );
      const departmentName = employeeRecord?.department || 'Not matched';

      return {
        timecard,
        timesheet,
        employeeRecord,
        clientName: timesheet?.client_name || 'Needs client match',
        departmentName,
        sourceCount: employeeRecord?.source?.length ?? 0,
      };
    });
  }, [approvedQuery.data, rejectedQuery.data, timecardQueries, timesheetById]);

  const clientOptions = useMemo<ComboboxOption[]>(() => {
    return (clientsQuery.data ?? [])
      .filter((client) => client.is_active)
      .map((client) => ({ id: client.client_id, label: client.client_name }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }, [clientsQuery.data]);

  const departmentOptions = useMemo<ComboboxOption[]>(() => {
    return (departmentsQuery.data ?? [])
      .map((department) => ({ id: department.department_id, label: department.department_name }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }, [departmentsQuery.data]);

  const selectedClient = (clientsQuery.data ?? []).find((client) => client.client_id === selectedClientId);
  const selectedDepartment = (departmentsQuery.data ?? []).find((department) => department.department_id === selectedDepartmentId);

  const visibleRows = useMemo(() => {
    const selectedStatusSet = new Set(selectedStatuses);
    return rows.filter((row) => {
      const rowStatus = getRowStatus(row.timecard);
      const rowWeekEnding = toDateKey(row.timecard.week_ending || row.timesheet?.week_ending);

      if (weekEnding && rowWeekEnding !== weekEnding) return false;
      if (selectedClient && normalize(row.clientName) !== normalize(selectedClient.client_name)) return false;
      if (selectedDepartment && normalize(row.departmentName) !== normalize(selectedDepartment.department_name)) return false;
      if (selectedStatusSet.size > 0 && (!rowStatus || !selectedStatusSet.has(rowStatus))) return false;

      return true;
    });
  }, [rows, selectedClient, selectedDepartment, selectedStatuses, weekEnding]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = visibleRows.slice(
    (safeCurrentPage - 1) * ROWS_PER_PAGE,
    safeCurrentPage * ROWS_PER_PAGE,
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const finalizedActionSet = useMemo(() => new Set(finalizedActionIds), [finalizedActionIds]);
  const isTimecardFinal = (timecard: TimecardEntry) => isFinalTimecardStatus(timecard.status) || finalizedActionSet.has(timecard.timecard_id);
  const selectablePaginatedRows = paginatedRows.filter((row) => !isTimecardFinal(row.timecard));
  const allVisibleSelected = selectablePaginatedRows.length > 0 && selectablePaginatedRows.every((row) => selectedSet.has(row.timecard.timecard_id));
  const selectedRows = useMemo(() => {
    const rowsById = new Map(rows.map((row) => [row.timecard.timecard_id, row]));
    return selectedIds.map((timecardId) => rowsById.get(timecardId)).filter((row): row is EmployeeReviewRow => Boolean(row));
  }, [rows, selectedIds]);
  const selectedApprovableIds = selectedRows
    .filter((row) => !isTimecardFinal(row.timecard) && !hasUnresolvedExceptions(row.timecard))
    .map((row) => row.timecard.timecard_id);
  const selectedRejectableIds = selectedRows
    .filter((row) => !isTimecardFinal(row.timecard))
    .map((row) => row.timecard.timecard_id);
  const isLoading = underReviewQuery.isLoading || processedQuery.isLoading || timecardQueries.some((query) => query.isLoading);
  const isRefetching = underReviewQuery.isRefetching || processedQuery.isRefetching || timecardQueries.some((query) => query.isRefetching);
  const error = underReviewQuery.error || processedQuery.error || timecardQueries.find((query) => query.error)?.error || approvedQuery.error || rejectedQuery.error;

  useEffect(() => {
    const nextSearchParams = new URLSearchParams();

    if (selectedClientId) nextSearchParams.set('client', selectedClientId);
    if (selectedDepartmentId) nextSearchParams.set('department', selectedDepartmentId);
    if (weekEnding) nextSearchParams.set('weekEnding', weekEnding);
    if (!areDefaultStatusFilters(selectedStatuses)) nextSearchParams.set('statuses', serializeStatusFilters(selectedStatuses));
    if (currentPage > 1) nextSearchParams.set('page', String(currentPage));
    if (isFilterOpen) nextSearchParams.set('filters', '1');

    const nextSearch = nextSearchParams.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch !== currentSearch) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [currentPage, isFilterOpen, location.search, selectedClientId, selectedDepartmentId, selectedStatuses, setSearchParams, weekEnding]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    setCurrentPage(1);
  }, [selectedClientId, selectedDepartmentId, selectedStatuses, weekEnding]);

  useEffect(() => {
    const visibleIds = new Set(
      visibleRows
        .filter((row) => !isTimecardFinal(row.timecard))
        .map((row) => row.timecard.timecard_id),
    );
    setSelectedIds((current) => {
      const nextSelectedIds = current.filter((timecardId) => visibleIds.has(timecardId));
      if (nextSelectedIds.length === current.length) return current;
      return nextSelectedIds;
    });
  }, [finalizedActionSet, visibleRows]);

  const refreshQueues = () => {
    underReviewQuery.refetch();
    processedQuery.refetch();
    approvedQuery.refetch();
    rejectedQuery.refetch();
    timecardQueries.forEach((query) => query.refetch());
  };

  const toggleStatus = (status: StatusFilter) => {
    setSelectedStatuses((current) => (
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    ));
  };

  const toggleOne = (timecardId: string) => {
    const row = rows.find((item) => item.timecard.timecard_id === timecardId);
    if (row && isTimecardFinal(row.timecard)) return;
    setSelectedIds((current) => (
      current.includes(timecardId)
        ? current.filter((item) => item !== timecardId)
        : [...current, timecardId]
    ));
  };

  const toggleAllVisible = () => {
    const pageIds = selectablePaginatedRows.map((row) => row.timecard.timecard_id);
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((timecardId) => !pageIds.includes(timecardId));
      return Array.from(new Set([...current, ...pageIds]));
    });
  };

  const approveSelected = () => {
    if (selectedApprovableIds.length === 0) return;
    approveMany(selectedApprovableIds, {
      onSuccess: (updatedTimecards) => {
        setFinalizedActionIds((current) => Array.from(new Set([
          ...current,
          ...updatedTimecards.map((timecard) => timecard.timecard_id),
        ])));
        toast.success('Selected employees were approved.', 'Approved');
        setSelectedIds([]);
      },
      onError: (requestError) => toast.error(requestError.message, 'Approve failed'),
    });
  };

  const rejectSelected = () => {
    if (selectedRejectableIds.length === 0) return;
    rejectMany(selectedRejectableIds, {
      onSuccess: (updatedTimecards) => {
        setFinalizedActionIds((current) => Array.from(new Set([
          ...current,
          ...updatedTimecards.map((timecard) => timecard.timecard_id),
        ])));
        toast.success('Selected employees were rejected.', 'Rejected');
        setSelectedIds([]);
      },
      onError: (requestError) => toast.error(requestError.message, 'Reject failed'),
    });
  };

  const approveOne = (timecard: TimecardEntry) => {
    if (isTimecardFinal(timecard) || hasUnresolvedExceptions(timecard)) return;
    setPendingAction({ timecardId: timecard.timecard_id, action: 'approve' });
    approveTimecard(timecard.timecard_id, {
      onSuccess: (updatedTimecard) => {
        setFinalizedActionIds((current) => Array.from(new Set([...current, updatedTimecard.timecard_id])));
        toast.success('Employee timecard approved.', 'Approved');
      },
      onError: (requestError) => toast.error(requestError.message, 'Approve failed'),
      onSettled: () => setPendingAction((current) => (
        current?.timecardId === timecard.timecard_id && current.action === 'approve' ? null : current
      )),
    });
  };

  const rejectOne = (timecard: TimecardEntry) => {
    if (isTimecardFinal(timecard)) return;
    setPendingAction({ timecardId: timecard.timecard_id, action: 'reject' });
    rejectTimecard(timecard.timecard_id, {
      onSuccess: (updatedTimecard) => {
        setFinalizedActionIds((current) => Array.from(new Set([...current, updatedTimecard.timecard_id])));
        toast.success('Employee timecard rejected.', 'Rejected');
      },
      onError: (requestError) => toast.error(requestError.message, 'Reject failed'),
      onSettled: () => setPendingAction((current) => (
        current?.timecardId === timecard.timecard_id && current.action === 'reject' ? null : current
      )),
    });
  };

  const openEmployeeReview = (row: EmployeeReviewRow) => {
    const returnSearchParams = new URLSearchParams(location.search);
    if (safeCurrentPage > 1) {
      returnSearchParams.set('page', String(safeCurrentPage));
    } else {
      returnSearchParams.delete('page');
    }
    const returnSearch = returnSearchParams.toString();

    navigate('employees/' + row.timecard.timecard_id, {
      state: {
        returnTo: location.pathname + (returnSearch ? '?' + returnSearch : ''),
        timecard: row.timecard,
        timesheet: row.timesheet,
      },
    });
  };

  const stopActionKeydown = (event: KeyboardEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const columns: TableColumn<EmployeeReviewRow>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleAllVisible}
          aria-label="Select visible employees"
          className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
        />
      ),
      accessor: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.timecard.timecard_id)}
          disabled={isTimecardFinal(row.timecard)}
          onChange={() => toggleOne(row.timecard.timecard_id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={'Select ' + (row.timecard.employee_name || 'employee')}
          className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
        />
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      accessor: (row) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className={'flex h-10 w-10 items-center justify-center rounded-lg ' + (getRowStatus(row.timecard) === 'exception' ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]')}>
            {getRowStatus(row.timecard) === 'exception' ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {row.timecard.employee_name || 'Unknown employee'}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
              {row.clientName} / {row.departmentName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'weekEnding',
      header: 'Week Ending',
      accessor: (row) => formatDate(row.timecard.week_ending || row.timesheet?.week_ending),
    },
    {
      key: 'reg',
      header: 'Reg',
      accessor: (row) => formatHours(row.timecard.reg_hours),
    },
    {
      key: 'ot',
      header: 'OT',
      accessor: (row) => formatHours(row.timecard.ot_hours),
    },
    {
      key: 'dt',
      header: 'DT',
      accessor: (row) => formatHours(row.timecard.dt_hours),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <Badge variant={getStatusVariant(row.timecard.status)}>{formatStatus(row.timecard.status)}</Badge>
          {row.sourceCount > 0 && <span className="text-xs text-[var(--text-muted)]">{row.sourceCount} source docs</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (row) => {
        const isApprovingThis = pendingAction?.timecardId === row.timecard.timecard_id && pendingAction.action === 'approve';
        const isRejectingThis = pendingAction?.timecardId === row.timecard.timecard_id && pendingAction.action === 'reject';
        const isActionPendingThis = isApprovingThis || isRejectingThis;
        const isFinal = isTimecardFinal(row.timecard);
        const hasOpenExceptions = hasUnresolvedExceptions(row.timecard);

        return (
          <div className="flex justify-end gap-3" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              aria-label="Approve employee timecard"
              title={hasOpenExceptions ? 'Resolve exceptions before approving' : 'Approve'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--success-text)] transition-colors hover:bg-[var(--success-bg)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[var(--text-muted)] disabled:opacity-45"
              disabled={isFinal || hasOpenExceptions || isActionPendingThis || isApprovingMany}
              onClick={() => approveOne(row.timecard)}
              onKeyDown={stopActionKeydown}
            >
              {isApprovingThis ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
              )}
            </button>
            <button
              type="button"
              aria-label="Reject employee timecard"
              title="Reject"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--danger-text)] transition-colors hover:bg-[var(--danger-bg)] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[var(--text-muted)] disabled:opacity-45"
              disabled={isFinal || isActionPendingThis || isRejectingMany}
              onClick={() => rejectOne(row.timecard)}
              onKeyDown={stopActionKeydown}
            >
              {isRejectingThis ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <XCircle className="h-5 w-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="relative z-10 overflow-visible rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-5 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Timecards
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Review regular, overtime, and double-time totals against merged source data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setIsFilterOpen((current) => !current)}
            >
              Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={<RefreshCw className={'h-4 w-4 ' + (isRefetching ? 'animate-spin' : '')} />}
              disabled={isLoading}
              onClick={refreshQueues}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              disabled={selectedApprovableIds.length === 0 || isRejectingMany}
              isLoading={isApprovingMany}
              onClick={approveSelected}
            >
              Bulk Approve ({selectedApprovableIds.length})
            </Button>
            <Button
              type="button"
              variant="danger"
              icon={<XCircle className="h-4 w-4" />}
              disabled={selectedRejectableIds.length === 0 || isApprovingMany}
              isLoading={isRejectingMany}
              onClick={rejectSelected}
            >
              Bulk Reject ({selectedRejectableIds.length})
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[var(--border-color)] bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Visible employees</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{visibleRows.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Exceptions</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{visibleRows.filter((row) => getRowStatus(row.timecard) === 'exception').length}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Approved</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{visibleRows.filter((row) => getRowStatus(row.timecard) === 'approved').length}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Selected</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{selectedIds.length}</p>
          </div>
        </div>

        {isFilterOpen && (
          <div className="border-b border-[var(--border-color)] bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[13rem_minmax(14rem,1fr)_minmax(14rem,1fr)_minmax(18rem,1.2fr)_auto] xl:items-end">
              <Input
                type="date"
                label="Week Ending"
                value={weekEnding}
                fullWidth
                onChange={(event) => setWeekEnding(resolveToWeekEndingSunday(event.target.value))}
              />
              <SearchableCombobox
                label="Client"
                value={selectedClientId}
                options={clientOptions}
                placeholder={clientsQuery.isLoading ? 'Loading clients' : 'Search clients'}
                onChange={(clientId) => {
                  setSelectedClientId(clientId);
                  setSelectedDepartmentId('');
                }}
              />
              <SearchableCombobox
                label="Department"
                value={selectedDepartmentId}
                options={departmentOptions}
                placeholder={selectedClientId ? 'Search departments' : 'Select client first'}
                disabled={!selectedClientId || departmentsQuery.isLoading}
                onChange={setSelectedDepartmentId}
              />
              <div>
                <p className="mb-1.5 text-sm font-medium text-[var(--text-primary)]">Status</p>
                <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-[var(--border-color)] bg-white px-3 py-2">
                  {statusOptions.map((option) => {
                    const isSelected = selectedStatuses.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleStatus(option.value)}
                        className={'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ' + (isSelected ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)] ring-blue-200' : 'bg-[var(--bg-card-soft)] text-[var(--text-secondary)] ring-[var(--border-color)] hover:text-[var(--text-primary)]')}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                icon={<X className="h-4 w-4" />}
                onClick={() => {
                  setWeekEnding('');
                  setSelectedClientId('');
                  setSelectedDepartmentId('');
                  setSelectedStatuses([...DEFAULT_STATUS_FILTERS]);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </section>

      <Table
        data={paginatedRows}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No timecard match the selected filters."
        rowKey={(row) => row.timecard.timecard_id}
        onRowClick={openEmployeeReview}
        rowClassName={(row) => getRowStatus(row.timecard) === 'exception' ? 'bg-amber-50/70' : ''}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
};






