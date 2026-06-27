import { Edit3, Trash2, Building2 } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import type { DepartmentResponse } from '../types';

interface GetDepartmentProps {
  department: DepartmentResponse;
  onUpdate: (department: DepartmentResponse) => void;
  onDelete: (department: DepartmentResponse) => void;
  onDepartmentClick?: (department: DepartmentResponse) => void;
  isDeleting?: boolean;
}

export const GetDepartment = ({
  department,
  onUpdate,
  onDelete,
  onDepartmentClick,
  isDeleting = false,
}: GetDepartmentProps) => {
  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  return (
    <article
      className="group rounded-xl border border-gray-100 bg-white p-4 shadow-2xs transition-all hover:border-blue-200 hover:shadow-sm cursor-pointer dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60"
      onClick={() => onDepartmentClick?.(department)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-bold text-purple-700 dark:bg-purple-950/35 dark:text-purple-300">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-950 dark:text-white">
              {department.department_name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-450">
              <span className="font-mono">ID: {department.department_id}</span>
              <span>Created {formatDate(department.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:self-center" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Edit3 className="h-4 w-4" />}
            onClick={() => onUpdate(department)}
          >
            Update
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            isLoading={isDeleting}
            onClick={() => onDelete(department)}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
};
