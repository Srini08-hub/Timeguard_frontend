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
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading department details...</p>
        </div>
      </div>
    );
  }

  if (departmentsError || !selectedDepartment || !resolvedClientId) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/70 p-8 text-center dark:border-red-950/40 dark:bg-red-950/15">
        <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">
          Department unavailable
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
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

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                  {selectedDepartment.department_name}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {client?.client_name ? client.client_name + ' department workspace' : 'Department workspace'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Department ID
              </p>
              <p className="mt-1 font-mono text-sm text-gray-950 dark:text-white">
                {selectedDepartment.department_id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Record type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  Department
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Assigned employees
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {assignments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Created on
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
                  {formatDate(selectedDepartment.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Client
                </p>
                <p className="mt-1 max-w-48 truncate text-sm font-semibold text-gray-950 dark:text-white">
                  {client?.client_name || resolvedClientId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
