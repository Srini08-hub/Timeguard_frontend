import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  RefreshCw,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { Spinner } from '../../../components/ui/Spinner';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { GetDepartment } from './GetDepartment';
import { useDeleteDepartment, useUpdateDepartment, useDepartmentsByClient } from '../hooks/useDepartments';
import type { DepartmentResponse } from '../types';

interface GetAllDepartmentsProps {
  clientId: string;
  onBack?: () => void;
  onDepartmentClick?: (department: DepartmentResponse) => void;
}

export const GetAllDepartments = ({ clientId, onDepartmentClick }: GetAllDepartmentsProps) => {
  const [departmentToUpdate, setDepartmentToUpdate] = useState<DepartmentResponse | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: departments = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useDepartmentsByClient(clientId);
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment();

  const totalPages = Math.ceil(departments.length / itemsPerPage);

  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return departments.slice(startIndex, endIndex);
  }, [departments, currentPage, itemsPerPage]);

  // Reset to page 1 when departments change
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openUpdateModal = (department: DepartmentResponse) => {
    setDepartmentToUpdate(department);
    setUpdatedName(department.department_name);
    setUpdateError('');
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!departmentToUpdate) return;

    const trimmedName = updatedName.trim();
    if (!trimmedName) {
      setUpdateError('Department name is required');
      toast.warning('Enter a valid department name.', 'Missing detail');
      return;
    }

    updateDepartment(
      {
        departmentId: departmentToUpdate.department_id,
        departmentData: { department_name: trimmedName },
      },
      {
        onSuccess: () => {
          setDepartmentToUpdate(null);
          setUpdatedName('');
          toast.success(`Department was updated.`, 'Department updated');
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Update failed');
        },
      },
    );
  };

  const handleDelete = async (department: DepartmentResponse) => {
    const confirmed = await confirm({
      title: 'Delete department?',
      message: `${department.department_name} will be permanently removed.`,
      confirmText: 'Delete',
      cancelText: 'Keep department',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingDepartmentId(department.department_id);
    deleteDepartment(
      { departmentId: department.department_id, clientId },
      {
        onSuccess: () => {
          toast.success(`${department.department_name} was deleted.`, 'Department deleted');
          setDeletingDepartmentId(null);
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Delete failed');
          setDeletingDepartmentId(null);
        },
      },
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            All Departments ({departments.length})
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            icon={
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
              />
            }
            disabled={isLoading}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading departments...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-950/30 dark:bg-red-950/10">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-400">
            Failed to load departments
          </h3>
          <p className="mt-1 text-xs text-red-650 dark:text-red-500">
            {error.message}
          </p>
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-250 bg-gray-50/60 p-10 text-center dark:border-gray-800 dark:bg-gray-900/20">
          <Building2 className="mx-auto h-9 w-9 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            No departments found
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add a department to this client.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {paginatedDepartments.map((department) => (
              <GetDepartment
                key={department.department_id}
                department={department}
                onUpdate={openUpdateModal}
                onDelete={handleDelete}
                onDepartmentClick={onDepartmentClick}
                isDeleting={deletingDepartmentId === department.department_id}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <Modal
        isOpen={Boolean(departmentToUpdate)}
        onClose={() => setDepartmentToUpdate(null)}
        title="Update Department"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="update-department-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Department name
            </label>
            <Input
              id="update-department-name"
              value={updatedName}
              onChange={(event) => {
                setUpdatedName(event.target.value);
                if (updateError) setUpdateError('');
              }}
              error={updateError}
              placeholder="Department name"
              disabled={isUpdating}
              fullWidth
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDepartmentToUpdate(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
