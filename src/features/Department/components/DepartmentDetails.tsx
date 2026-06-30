import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Link2,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useClient } from '../../Client/hooks/useClients';
import { AssignedEmployees } from '../../Assignments/components/AssignedEmployees';
import { DepartmentClientRulePanel } from '../../ClientRules/components/DepartmentClientRulePanel';
import { AssignEmployeeModal } from '../../Assignments/components/AssignEmployeeModal';
import { useAssignmentsByDepartment } from '../../Assignments/hooks/useAssignments';
import { useDepartmentsByClient } from '../hooks/useDepartments';
import type { DepartmentResponse } from '../types';

interface DepartmentDetailsProps {
  department?: DepartmentResponse;
  clientId?: string;
  onBack?: () => void;
}

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

export const DepartmentDetails = ({ department, clientId, onBack }: DepartmentDetailsProps) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const navigate = useNavigate();
  const { clientId: routeClientId, departmentId: routeDepartmentId } = useParams<{
    clientId: string;
    departmentId: string;
  }>();

  const resolvedClientId = clientId || routeClientId || department?.client_id || '';
  const resolvedDepartmentId = department?.department_id || routeDepartmentId || '';

  const {
    data: departments = [],
    error: departmentsError,
    isLoading: departmentsLoading,
  } = useDepartmentsByClient(resolvedClientId);
  const { data: client } = useClient(resolvedClientId);
  const { data: assignments = [] } = useAssignmentsByDepartment(resolvedDepartmentId);

  const selectedDepartment = useMemo(() => {
    if (department) return department;
    return departments.find((item) => item.department_id === resolvedDepartmentId);
  }, [department, departments, resolvedDepartmentId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (resolvedClientId) {
      navigate('/ops-admin/clients/' + resolvedClientId);
      return;
    }

    navigate('/ops-admin/clients');
  };

  if (!department && departmentsLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-[var(--border-color)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[var(--text-muted)]">Loading department details...</p>
        </div>
      </div>
    );
  }

  if (departmentsError || !selectedDepartment || !resolvedClientId) {
    return (
      <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--danger-text)]">
          Department unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--danger-text)]">
          {departmentsError?.message || 'The selected department could not be found.'}
        </p>
        <Button className="mt-5" variant="outline" onClick={handleBack}>
          Back to Client
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
          onClick={handleBack}
        >
          Departments
        </Button>
        <Button
          type="button"
          variant="primary"
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => setIsAssignModalOpen(true)}
        >
          Assign Employee
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {selectedDepartment.department_name}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {client?.client_name ? client.client_name + ' department workspace' : 'Department workspace'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Department ID
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">
                {selectedDepartment.department_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Record type
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  Department
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Assigned employees
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {assignments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border-color)] p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-card-soft)] text-[var(--text-secondary)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Created on
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(selectedDepartment.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Client
                </p>
                <p className="mt-1 max-w-48 truncate text-sm font-semibold text-[var(--text-primary)]">
                  {client?.client_name || resolvedClientId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DepartmentClientRulePanel
        clientId={resolvedClientId}
        departmentId={selectedDepartment.department_id}
        departmentName={selectedDepartment.department_name}
      />

      <AssignedEmployees departmentId={selectedDepartment.department_id} clientId={resolvedClientId} />

      <AssignEmployeeModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        departmentId={selectedDepartment.department_id}
        clientId={resolvedClientId}
      />
    </div>
  );
};
