import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

import { Badge, type BadgeProps } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useToast } from '../../../hooks/useToast';
import {
  useApproveTimecard,
  useBulkApproveTimecards,
  useRejectTimecard,
  useTimecardsByTimesheet,
} from '../hooks/useTimecards';
import type { TimecardEntry } from '../types';

interface TimecardTableProps {
  timesheetId: string;
}

const formatHours = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return '0.00';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
};

const getStatusVariant = (status: string): NonNullable<BadgeProps['variant']> => {
  if (status === 'clean' || status === 'approved') return 'success';
  if (status === 'exception' || status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
};

const formatStatus = (status: string) => {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const TimecardTable = ({ timesheetId }: TimecardTableProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: timecards = [], error, isLoading } = useTimecardsByTimesheet(timesheetId);
  const { mutate: approveTimecard, isPending: isApprovingOne } = useApproveTimecard();
  const { mutate: approveMany, isPending: isApprovingMany } = useBulkApproveTimecards();
  const { mutate: rejectTimecard, isPending: isRejecting } = useRejectTimecard();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected = timecards.length > 0 && timecards.every((timecard) => selectedSet.has(timecard.timecard_id));

  const toggleOne = (timecardId: string) => {
    setSelectedIds((current) =>
      current.includes(timecardId)
        ? current.filter((item) => item !== timecardId)
        : [...current, timecardId],
    );
  };

  const toggleAll = () => {
    setSelectedIds(allVisibleSelected ? [] : timecards.map((timecard) => timecard.timecard_id));
  };

  const approveSelected = () => {
    if (selectedIds.length === 0) return;
    approveMany(selectedIds, {
      onSuccess: () => {
        toast.success('Selected timecards were approved.', 'Approved');
        setSelectedIds([]);
      },
      onError: (requestError) => toast.error(requestError.message, 'Approve failed'),
    });
  };

  const approveOne = (timecard: TimecardEntry) => {
    approveTimecard(timecard.timecard_id, {
      onSuccess: () => toast.success('Timecard approved.', 'Approved'),
      onError: (requestError) => toast.error(requestError.message, 'Approve failed'),
    });
  };

  const rejectOne = (timecard: TimecardEntry) => {
    rejectTimecard(timecard.timecard_id, {
      onSuccess: () => toast.success('Timecard rejected.', 'Rejected'),
      onError: (requestError) => toast.error(requestError.message, 'Reject failed'),
    });
  };

  const openRow = (timecard: TimecardEntry) => {
    if (timecard.status === 'exception' || timecard.status === 'approved') {
      navigate('/reviewer/timecards/' + timecard.timecard_id + '/exception');
    }
  };

  const columns: TableColumn<TimecardEntry>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleAll}
          aria-label="Select all timecards"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      accessor: (timecard) => (
        <input
          type="checkbox"
          checked={selectedSet.has(timecard.timecard_id)}
          onChange={() => toggleOne(timecard.timecard_id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={'Select ' + (timecard.employee_name || 'timecard')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'employee',
      header: 'Employee Name',
      accessor: (timecard) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">
            {timecard.status === 'exception' ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-950 dark:text-white">
              {timecard.employee_name || 'Unknown employee'}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
              {timecard.timecard_id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'reg',
      header: 'Regular Hours',
      accessor: (timecard) => formatHours(timecard.reg_hours),
    },
    {
      key: 'ot',
      header: 'OT Hours',
      accessor: (timecard) => formatHours(timecard.ot_hours),
    },
    {
      key: 'dt',
      header: 'DT Hours',
      accessor: (timecard) => formatHours(timecard.dt_hours),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (timecard) => (
        <div className="flex flex-col gap-1">
          <Badge variant={getStatusVariant(timecard.status)}>{formatStatus(timecard.status)}</Badge>
          {timecard.severity !== 'none' && <span className="text-xs text-gray-500 dark:text-gray-400">{formatStatus(timecard.severity)} severity</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (timecard) => (
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Approve timecard"
            className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/25"
            disabled={isApprovingOne || isApprovingMany}
            onClick={() => approveOne(timecard)}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Reject timecard"
            className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/25"
            disabled={isRejecting}
            onClick={() => rejectOne(timecard)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Timecard Entries</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review generated regular, overtime, and double-time totals.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            icon={<CheckCircle2 className="h-4 w-4" />}
            disabled={selectedIds.length === 0}
            isLoading={isApprovingMany}
            onClick={approveSelected}
          >
            Approve Selected ({selectedIds.length})
          </Button>
        </div>
      </div>

      <Table
        data={timecards}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No generated timecards are available for this timesheet."
        rowKey="timecard_id"
        onRowClick={openRow}
        rowClassName={(timecard) =>
          timecard.status === 'exception'
            ? 'bg-red-50/30 dark:bg-red-950/10'
            : ''
        }
      />
    </section>
  );
};

