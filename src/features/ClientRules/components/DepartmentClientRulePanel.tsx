import { ArrowUpRight, BadgeCheck, Clock3, Plus, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useClientRulesByDepartment } from '../hooks/useClientRules';
import type { ClientRuleNumber, ClientRuleResponse } from '../types';

interface DepartmentClientRulePanelProps {
  clientId: string;
  departmentId: string;
  departmentName: string;
}

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

const pickPrimaryRule = (rules: ClientRuleResponse[]) => {
  return rules.find((rule) => rule.is_active) || rules[0];
};

export const DepartmentClientRulePanel = ({
  clientId,
  departmentId,
  departmentName,
}: DepartmentClientRulePanelProps) => {
  const navigate = useNavigate();
  const { data: rules = [], error, isLoading } = useClientRulesByDepartment(departmentId);
  const primaryRule = pickPrimaryRule(rules);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-gray-950">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                Client rules
              </h2>
              <Badge variant={rules.length ? 'success' : 'neutral'}>
                {rules.length ? 'Configured' : 'No rule'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pay policy and break deduction settings for {departmentName}.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            icon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() => navigate('rules')}
          >
            View Rules
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('rules/new')}
          >
            Add Rule
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 px-6 py-8 text-sm text-gray-500 dark:text-gray-400">
          <Spinner size="sm" />
          Loading client rules...
        </div>
      ) : error ? (
        <div className="px-6 py-6 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </div>
      ) : primaryRule ? (
        <div className="grid md:grid-cols-4">
          <div className="border-b border-gray-200 p-5 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Weekly OT
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">
              {formatHours(primaryRule.weekly_ot_threshold)}
            </p>
          </div>
          <div className="border-b border-gray-200 p-5 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Weekly DT
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">
              {formatHours(primaryRule.weekly_dt_threshold)}
            </p>
          </div>
          <div className="border-b border-gray-200 p-5 dark:border-gray-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Multipliers
            </p>
            <p className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">
              {formatMultiplier(primaryRule.ot_multiplier)} / {formatMultiplier(primaryRule.dt_multiplier)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Break policy
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
              {primaryRule.break_auto_deduct ? (
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <Clock3 className="h-4 w-4 text-gray-400" />
              )}
              {primaryRule.break_auto_deduct
                ? 'Auto deduct ' + formatHours(primaryRule.break_deduction_hrs)
                : 'Manual review'}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-6 py-8">
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-5 dark:border-gray-700 dark:bg-gray-900/50">
            <p className="text-sm font-semibold text-gray-950 dark:text-white">
              No client rule has been configured for this department.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add a rule to define overtime thresholds, double-time thresholds, multipliers, and break deduction behavior.
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 px-6 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        Client ID: <span className="font-mono">{clientId}</span>
      </div>
    </section>
  );
};
