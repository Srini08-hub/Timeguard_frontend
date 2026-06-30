import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Edit3,
  Plus,
  ReceiptText,
  Trash2,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { useClient } from '../../Client/hooks/useClients';
import { useDepartmentsByClient } from '../../Department/hooks/useDepartments';
import {
  useClientRulesByDepartment,
  useDeleteClientRule,
} from '../hooks/useClientRules';
import type { ClientRuleNumber, ClientRuleResponse } from '../types';

const RULES_PER_PAGE = 10;

const toNumber = (value: ClientRuleNumber | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatHours = (value: ClientRuleNumber | null | undefined) => {
  const numericValue = toNumber(value);
  return numericValue === null ? 'Not set' : numericValue.toFixed(2) + ' hrs';
};

const formatMultiplier = (value: ClientRuleNumber | null | undefined) => {
  const numericValue = toNumber(value);
  return numericValue === null ? 'Not set' : numericValue.toFixed(2) + 'x';
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const ClientRulesList = () => {
  const { clientId = '', departmentId = '' } = useParams<{
    clientId: string;
    departmentId: string;
  }>();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  const { data: client } = useClient(clientId);
  const { data: departments = [], isLoading: isDepartmentLoading } =
    useDepartmentsByClient(clientId);
  const {
    data: rules = [],
    error,
    isLoading,
  } = useClientRulesByDepartment(departmentId);
  const { mutate: deleteRule } = useDeleteClientRule();

  const department = departments.find((item) => item.department_id === departmentId);
  const totalPages = Math.max(1, Math.ceil(rules.length / RULES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRules = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * RULES_PER_PAGE;
    return rules.slice(startIndex, startIndex + RULES_PER_PAGE);
  }, [rules, safeCurrentPage]);

  const handleDelete = async (rule: ClientRuleResponse) => {
    const confirmed = await confirm({
      title: 'Delete client rule?',
      message: 'This rule will be removed from active department policy.',
      confirmText: 'Delete Rule',
      cancelText: 'Keep rule',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingRuleId(rule.rule_id);
    deleteRule(
      { ruleId: rule.rule_id, departmentId },
      {
        onSuccess: () => {
          toast.success('Client rule was deleted.', 'Rule deleted');
          setDeletingRuleId(null);
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Delete failed');
          setDeletingRuleId(null);
        },
      },
    );
  };

  const columns: TableColumn<ClientRuleResponse>[] = [
    {
      key: 'policy',
      header: 'Rule',
      accessor: (rule) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <ReceiptText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-[var(--text-primary)]">
                Department pay rule
              </span>
              <Badge variant={rule.is_active ? 'success' : 'neutral'}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <span className="mt-0.5 block truncate font-mono text-xs text-[var(--text-muted)]">
              {rule.rule_id}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'thresholds',
      header: 'Thresholds',
      accessor: (rule) => (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">
            OT {formatHours(rule.weekly_ot_threshold)}
          </p>
          <p className="text-[var(--text-muted)]">
            DT {formatHours(rule.weekly_dt_threshold)}
          </p>
        </div>
      ),
    },
    {
      key: 'multipliers',
      header: 'Multipliers',
      accessor: (rule) => (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">
            OT {formatMultiplier(rule.ot_multiplier)}
          </p>
          <p className="text-[var(--text-muted)]">
            DT {formatMultiplier(rule.dt_multiplier)}
          </p>
        </div>
      ),
    },
    {
      key: 'break',
      header: 'Break deduction',
      accessor: (rule) => (
        <div className="flex items-center gap-2 text-sm">
          {rule.break_auto_deduct ? (
            <BadgeCheck className="h-4 w-4 text-[var(--success-text)]" />
          ) : (
            <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
          )}
          <span>
            {rule.break_auto_deduct
              ? formatHours(rule.break_deduction_hrs)
              : 'Manual review'}
          </span>
        </div>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      accessor: (rule) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
          {formatDate(rule.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (rule) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Update client rule"
            className="h-9 w-9"
            onClick={() => navigate(rule.rule_id + '/edit')}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Delete client rule"
            className="h-9 w-9 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
            disabled={deletingRuleId === rule.rule_id}
            onClick={() => handleDelete(rule)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isDepartmentLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading rule workspace...</p>
        </div>
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
          onClick={() => navigate('/ops-admin/clients/' + clientId + '/departments/' + departmentId)}
        >
          Department
        </Button>
        <Button
          type="button"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('new')}
        >
          Add Rule
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Client Rules
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {department?.department_name || 'Department'} policy for {client?.client_name || 'client'}.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Active rules
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                {rules.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Table
        data={paginatedRules}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No client rules have been configured for this department."
        rowKey="rule_id"
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
};
