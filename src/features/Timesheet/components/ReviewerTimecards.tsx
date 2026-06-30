import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useToast } from '../../../hooks/useToast';
import {
  useApprovedTimecards,
  useExportApprovedTimecards,
  useRejectedTimecards,
} from '../hooks/useTimecards';
import type { TimecardEntry } from '../types';

type TimecardView = 'approved' | 'rejected';

const TIMECARDS_PER_PAGE = 10;

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const normalizeDate = (value?: string | null) => value?.slice(0, 10) ?? '';

const formatNumber = (value?: number | string | null) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return '0.00';
  return numericValue.toFixed(2);
};

const formatCurrency = (value?: number | string | null) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return '\u20B90.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(numericValue);
};

export const ReviewerTimecards = () => {
  const [view, setView] = useState<TimecardView>('approved');
  const [weekEndingSearch, setWeekEndingSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  const {
    data: approvedTimecards = [],
    error: approvedError,
    isLoading: isApprovedLoading,
  } = useApprovedTimecards();
  const {
    data: rejectedTimecards = [],
    error: rejectedError,
    isLoading: isRejectedLoading,
  } = useRejectedTimecards();
  const { mutate: exportApproved, isPending: isExporting } = useExportApprovedTimecards();

  const displayedApprovedTimecards = useMemo(() => {
    if (!weekEndingSearch) return approvedTimecards;
    return approvedTimecards.filter(
      (timecard) => normalizeDate(timecard.week_ending) === weekEndingSearch,
    );
  }, [approvedTimecards, weekEndingSearch]);

  const tableData = view === 'approved' ? displayedApprovedTimecards : rejectedTimecards;
  const totalPages = Math.max(1, Math.ceil(tableData.length / TIMECARDS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTableData = tableData.slice(
    (safeCurrentPage - 1) * TIMECARDS_PER_PAGE,
    safeCurrentPage * TIMECARDS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [view, weekEndingSearch]);

  const handleExport = () => {
    if (!weekEndingSearch) {
      toast.warning('Enter a week ending date before exporting.', 'Week ending required');
      return;
    }

    exportApproved(weekEndingSearch, {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `approved-timecards-${weekEndingSearch}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Approved timecards export downloaded.', 'Export ready');
      },
      onError: (error) => {
        toast.error(error.message, 'Export failed');
      },
    });
  };

  const approvedColumns: TableColumn<TimecardEntry>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (timecard) => (
        <span className="font-semibold text-[var(--text-primary)]">
          {timecard.employee_name || 'Unmatched employee'}
        </span>
      ),
    },
    {
      key: 'weekEnding',
      header: 'Week Ending',
      accessor: (timecard) => formatDate(timecard.week_ending),
    },
    {
      key: 'regularHours',
      header: 'Regular Hours',
      accessor: (timecard) => formatNumber(timecard.reg_hours),
    },
    {
      key: 'otHours',
      header: 'Overtime Hours',
      accessor: (timecard) => formatNumber(timecard.ot_hours),
    },
    {
      key: 'dtHours',
      header: 'Double Time Hours',
      accessor: (timecard) => formatNumber(timecard.dt_hours),
    },
    {
      key: 'payRate',
      header: 'Pay Rate',
      accessor: (timecard) => formatCurrency(timecard.pay_rate),
    },
    {
      key: 'grossPay',
      header: 'Gross Pay',
      accessor: (timecard) => (
        <span className="font-semibold text-[var(--text-primary)]">
          {formatCurrency(timecard.gross_pay)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: () => <Badge variant="success">Approved</Badge>,
    },
  ];

  const rejectedColumns: TableColumn<TimecardEntry>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (timecard) => (
        <span className="font-semibold text-[var(--text-primary)]">
          {timecard.employee_name || 'Unmatched employee'}
        </span>
      ),
    },
    {
      key: 'weekEnding',
      header: 'Week Ending',
      accessor: (timecard) => formatDate(timecard.week_ending),
    },
    {
      key: 'regularHours',
      header: 'Regular Hours',
      accessor: (timecard) => formatNumber(timecard.reg_hours),
    },
    {
      key: 'otHours',
      header: 'Overtime Hours',
      accessor: (timecard) => formatNumber(timecard.ot_hours),
    },
    {
      key: 'dtHours',
      header: 'Double Time Hours',
      accessor: (timecard) => formatNumber(timecard.dt_hours),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: () => <Badge variant="danger">Rejected</Badge>,
    },
    {
      key: 'comment',
      header: 'Reviewer Comment',
      accessor: (timecard) => timecard.review_comment || '-',
    },
  ];

  const tableColumns = view === 'approved' ? approvedColumns : rejectedColumns;
  const isLoading = view === 'approved' ? isApprovedLoading : isRejectedLoading;
  const error = view === 'approved' ? approvedError?.message : rejectedError?.message;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm shadow-gray-950/5 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Timecard Status"
            value={view}
            onChange={(event) => setView(event.target.value as TimecardView)}
            options={[
              { value: 'approved', label: 'Approved Timecards' },
              { value: 'rejected', label: 'Rejected Timecards' },
            ]}
            fullWidth
          />

          {view === 'approved' && (
            <Input
              label="Search Week Ending"
              type="date"
              value={weekEndingSearch}
              onChange={(event) => setWeekEndingSearch(event.target.value)}
              fullWidth
            />
          )}
        </div>

        {view === 'approved' && (
          <Button
            type="button"
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            isLoading={isExporting}
            disabled={!weekEndingSearch || displayedApprovedTimecards.length === 0}
          >
            Export
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
        <FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" />
        {view === 'approved'
          ? weekEndingSearch
            ? `${displayedApprovedTimecards.length} approved timecard(s) for ${formatDate(weekEndingSearch)}`
            : `${displayedApprovedTimecards.length} approved timecard(s)`
          : `${rejectedTimecards.length} rejected timecard(s)`}
      </div>

      <Table
        data={paginatedTableData}
        columns={tableColumns}
        isLoading={isLoading}
        error={error}
        emptyMessage={
          view === 'approved' && weekEndingSearch
            ? 'No timecards found for this week ending.'
            : view === 'approved'
              ? 'No approved timecards are available.'
              : 'No rejected timecards are available.'
        }
        rowKey={(timecard) => timecard.timecard_id}
        pagination={
          tableData.length > TIMECARDS_PER_PAGE
            ? {
                currentPage: safeCurrentPage,
                totalPages,
                onPageChange: setCurrentPage,
              }
            : undefined
        }
      />
    </section>
  );
};
