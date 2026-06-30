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

type PendingTimecardAction = {
  timecardId: string;
  action: 'approve' | 'reject';
} | null;

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
  const [pendingAction, setPendingAction] = useState<PendingTimecardAction>(null);
  const { data: timecards = [], error, isLoading } = useTimecardsByTimesheet(timesheetId);
  const { mutate: approveTimecard } = useApproveTimecard();
  const { mutate: approveMany, isPending: isApprovingMany } = useBulkApproveTimecards();
  const { mutate: rejectTimecard } = useRejectTimecard();

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
    const timecardId = timecard.timecard_id;
    setPendingAction({ timecardId, action: 'approve' });
    approveTimecard(timecardId, {
      onSuccess: () => toast.success('Timecard approved.', 'Approved'),
      onError: (requestError) => toast.error(requestError.message, 'Approve failed'),
      onSettled: () => {
        setPendingAction((current) =>
          current?.timecardId === timecardId && current.action === 'approve' ? null : current,
        );
      },
    });
  };

  const rejectOne = (timecard: TimecardEntry) => {
    const timecardId = timecard.timecard_id;
    setPendingAction({ timecardId, action: 'reject' });
    rejectTimecard(timecardId, {
      onSuccess: () => toast.success('Timecard rejected.', 'Rejected'),
      onError: (requestError) => toast.error(requestError.message, 'Reject failed'),
      onSettled: () => {
        setPendingAction((current) =>
          current?.timecardId === timecardId && current.action === 'reject' ? null : current,
        );
      },
    });
  };

  const openRow = (timecard: TimecardEntry) => {
    if (timecard.status === 'exception') {
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
          className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
        />
      ),
      accessor: (timecard) => (
        <input
          type="checkbox"
          checked={selectedSet.has(timecard.timecard_id)}
          onChange={() => toggleOne(timecard.timecard_id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={'Select ' + (timecard.employee_name || 'timecard')}
          className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
        />
      ),
    },
    {
      key: 'employee',
      header: 'Employee Name',
      accessor: (timecard) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            {timecard.status === 'exception' ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {timecard.employee_name || 'Unknown employee'}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">
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
          {timecard.severity !== 'none' && <span className="text-xs text-[var(--text-muted)]">{formatStatus(timecard.severity)} severity</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (timecard) => {
        const isApprovingThis = pendingAction?.timecardId === timecard.timecard_id && pendingAction.action === 'approve';
        const isRejectingThis = pendingAction?.timecardId === timecard.timecard_id && pendingAction.action === 'reject';

        return (
          <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Approve timecard"
              className="h-10 w-10 rounded-full border border-emerald-200 bg-emerald-50 font-bold text-[var(--success-text)] shadow-sm hover:border-emerald-300 hover:bg-[var(--success-bg)] hover:text-[var(--success-text)]"
              disabled={isApprovingThis || isApprovingMany}
              isLoading={isApprovingThis}
              onClick={() => approveOne(timecard)}
            >
              <CheckCircle2 className="h-5 w-5 stroke-[2.75]" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reject timecard"
              className="h-10 w-10 rounded-full border border-red-200 bg-red-50 font-bold text-[var(--danger-text)] shadow-sm hover:border-red-300 hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
              disabled={isRejectingThis}
              isLoading={isRejectingThis}
              onClick={() => rejectOne(timecard)}
            >
              <XCircle className="h-5 w-5 stroke-[2.75]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Timecard Entries</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
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
            ? 'bg-red-50/60'
            : ''
        }
      />
    </section>
  );
};
