import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Clock3, ReceiptText, Save } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { useClient } from '../../Client/hooks/useClients';
import { useDepartmentsByClient } from '../../Department/hooks/useDepartments';
import {
  useClientRule,
  useCreateClientRule,
  useUpdateClientRule,
} from '../hooks/useClientRules';
import type { ClientRuleCreate, ClientRuleNumber, ClientRuleUpdate } from '../types';

interface RuleFormState {
  weeklyOtThreshold: string;
  weeklyDtThreshold: string;
  otMultiplier: string;
  dtMultiplier: string;
  breakDeductionHrs: string;
  breakAutoDeduct: boolean;
}

const initialState: RuleFormState = {
  weeklyOtThreshold: '40',
  weeklyDtThreshold: '',
  otMultiplier: '1.5',
  dtMultiplier: '2.0',
  breakDeductionHrs: '',
  breakAutoDeduct: false,
};

const toInputValue = (value: ClientRuleNumber | null | undefined) => {
  return value === null || value === undefined ? '' : String(value);
};

const parseOptionalNumber = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;
  return Number(trimmedValue);
};

const parseRequiredNumber = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue ? Number(trimmedValue) : Number.NaN;
};

const hasInvalidNumber = (value: number | null) => {
  return value !== null && (!Number.isFinite(value) || value < 0);
};

export const ClientRuleFormPage = () => {
  const { clientId = '', departmentId = '', ruleId } = useParams<{
    clientId: string;
    departmentId: string;
    ruleId?: string;
  }>();
  const isEditing = Boolean(ruleId);
  const navigate = useNavigate();
  const toast = useToast();

  const [formState, setFormState] = useState<RuleFormState>(initialState);
  const [formError, setFormError] = useState('');

  const { data: client } = useClient(clientId);
  const { data: departments = [], isLoading: isDepartmentLoading } =
    useDepartmentsByClient(clientId);
  const { data: rule, isLoading: isRuleLoading } = useClientRule(ruleId);
  const { mutate: createRule, isPending: isCreating } = useCreateClientRule();
  const { mutate: updateRule, isPending: isUpdating } = useUpdateClientRule();

  const department = useMemo(
    () => departments.find((item) => item.department_id === departmentId),
    [departments, departmentId],
  );

  useEffect(() => {
    if (!rule) return;

    setFormState({
      weeklyOtThreshold: toInputValue(rule.weekly_ot_threshold),
      weeklyDtThreshold: toInputValue(rule.weekly_dt_threshold),
      otMultiplier: toInputValue(rule.ot_multiplier),
      dtMultiplier: toInputValue(rule.dt_multiplier),
      breakDeductionHrs: toInputValue(rule.break_deduction_hrs),
      breakAutoDeduct: rule.break_auto_deduct,
    });
  }, [rule]);

  const isSubmitting = isCreating || isUpdating;
  const departmentPath = '/ops-admin/clients/' + clientId + '/departments/' + departmentId;
  const rulesPath = departmentPath + '/rules';

  const updateField = (field: keyof RuleFormState, value: string | boolean) => {
    setFormState((current) => ({ ...current, [field]: value }));
    if (formError) setFormError('');
  };

  const buildPayload = (): ClientRuleCreate | ClientRuleUpdate | null => {
    const weeklyOtThreshold = parseRequiredNumber(formState.weeklyOtThreshold);
    const weeklyDtThreshold = parseOptionalNumber(formState.weeklyDtThreshold);
    const otMultiplier = parseRequiredNumber(formState.otMultiplier);
    const dtMultiplier = parseRequiredNumber(formState.dtMultiplier);
    const breakDeductionHrs = parseOptionalNumber(formState.breakDeductionHrs);

    if (
      hasInvalidNumber(weeklyOtThreshold) ||
      hasInvalidNumber(weeklyDtThreshold) ||
      hasInvalidNumber(otMultiplier) ||
      hasInvalidNumber(dtMultiplier) ||
      hasInvalidNumber(breakDeductionHrs)
    ) {
      setFormError('Enter non-negative numeric values for all rule fields.');
      return null;
    }

    if (!Number.isFinite(weeklyOtThreshold) || !Number.isFinite(otMultiplier) || !Number.isFinite(dtMultiplier)) {
      setFormError('Weekly OT threshold, OT multiplier, and DT multiplier are required.');
      return null;
    }

    return {
      client_id: clientId,
      department_id: departmentId,
      weekly_ot_threshold: weeklyOtThreshold,
      weekly_dt_threshold: weeklyDtThreshold,
      ot_multiplier: otMultiplier,
      dt_multiplier: dtMultiplier,
      break_deduction_hrs: breakDeductionHrs,
      break_auto_deduct: formState.breakAutoDeduct,
    };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload();
    if (!payload) return;

    if (isEditing && ruleId) {
      updateRule(
        { ruleId, ruleData: payload },
        {
          onSuccess: () => {
            toast.success('Client rule was updated.', 'Rule updated');
            navigate(departmentPath);
          },
          onError: (requestError) => {
            toast.error(requestError.message, 'Update failed');
          },
        },
      );
      return;
    }

    createRule(payload as ClientRuleCreate, {
      onSuccess: () => {
        toast.success('Client rule was created.', 'Rule created');
        navigate(departmentPath);
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Create failed');
      },
    });
  };

  if (isDepartmentLoading || isRuleLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading rule form...</p>
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
          onClick={() => navigate(rulesPath)}
        >
          Client Rules
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <ReceiptText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {isEditing ? 'Update Client Rule' : 'Add Client Rule'}
                  </h1>
                  <Badge variant="info">
                    {department?.department_name || 'Department'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {client?.client_name || 'Client'} pay policy configuration
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Department ID
              </p>
              <p className="mt-1 max-w-72 truncate font-mono text-sm text-[var(--text-primary)]">
                {departmentId}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="weekly-ot-threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Weekly OT threshold"
                  value={formState.weeklyOtThreshold}
                  onChange={(event) => updateField('weeklyOtThreshold', event.target.value)}
                  disabled={isSubmitting}
                  fullWidth
                />
                <Input
                  id="weekly-dt-threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Weekly DT threshold"
                  value={formState.weeklyDtThreshold}
                  onChange={(event) => updateField('weeklyDtThreshold', event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Optional"
                  fullWidth
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="ot-multiplier"
                  type="number"
                  min="0"
                  step="0.01"
                  label="OT multiplier"
                  value={formState.otMultiplier}
                  onChange={(event) => updateField('otMultiplier', event.target.value)}
                  disabled={isSubmitting}
                  fullWidth
                />
                <Input
                  id="dt-multiplier"
                  type="number"
                  min="0"
                  step="0.01"
                  label="DT multiplier"
                  value={formState.dtMultiplier}
                  onChange={(event) => updateField('dtMultiplier', event.target.value)}
                  disabled={isSubmitting}
                  fullWidth
                />
              </div>

              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]">
                      {formState.breakAutoDeduct ? (
                        <BadgeCheck className="h-5 w-5 text-[var(--success-text)]" />
                      ) : (
                        <Clock3 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Break deduction
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {formState.breakAutoDeduct ? 'Automatic deduction enabled' : 'Manual review enabled'}
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={formState.breakAutoDeduct}
                      onChange={(event) => updateField('breakAutoDeduct', event.target.checked)}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    Auto deduct
                  </label>
                </div>

                <div className="mt-4">
                  <Input
                    id="break-deduction-hrs"
                    type="number"
                    min="0"
                    step="0.01"
                    label="Break deduction hours"
                    value={formState.breakDeductionHrs}
                    onChange={(event) => updateField('breakDeductionHrs', event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Optional"
                    fullWidth
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-4 py-3 text-sm font-medium text-[var(--danger-text)]">
                  {formError}
                </div>
              )}
            </div>

            <aside className="space-y-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Client
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {client?.client_name || clientId}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Department
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {department?.department_name || departmentId}
                </p>
              </div>
              {ruleId && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Rule ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--text-secondary)]">
                    {ruleId}
                  </p>
                </div>
              )}
            </aside>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--border-color)] pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(departmentPath)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save className="h-4 w-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};
