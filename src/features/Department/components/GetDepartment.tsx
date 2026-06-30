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
      className="group cursor-pointer rounded-lg border border-[var(--border-color)] bg-white p-4 shadow-sm shadow-gray-950/5 transition-all hover:border-[var(--primary)] hover:shadow-md"
      onClick={() => onDepartmentClick?.(department)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--text-primary)]">
              {department.department_name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
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
