import { useState } from 'react';
import { ArrowLeft, Building2, UserPlus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { AssignedEmployees } from '../../Assignments/components/AssignedEmployees';
import { AssignEmployeeModal } from '../../Assignments/components/AssignEmployeeModal';
import type { DepartmentResponse } from '../types';

interface DepartmentDetailsProps {
  department: DepartmentResponse;
  clientId: string;
  onBack?: () => void;
}

export const DepartmentDetails = ({ department, clientId, onBack }: DepartmentDetailsProps) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={onBack}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Department Details
          </h1>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-650 dark:bg-purple-950/35 dark:text-purple-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
                {department.department_name}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Department information and employee assignments
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                Department ID
              </label>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                {department.department_id}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                Client ID
              </label>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                {department.client_id}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-750 dark:text-gray-200">
                Created At
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(department.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Employee
            </Button>
          </div>
        </div>
      </div>

      <AssignedEmployees departmentId={department.department_id} clientId={clientId} />

      <AssignEmployeeModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        departmentId={department.department_id}
        clientId={clientId}
      />
    </div>
  );
};
