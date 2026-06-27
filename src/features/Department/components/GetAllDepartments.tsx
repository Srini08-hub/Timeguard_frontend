import { type FormEvent, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Edit3,
  Plus,
  // RefreshCw,
  Trash2,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { useDeleteDepartment, useUpdateDepartment, useDepartmentsByClient } from '../hooks/useDepartments';
import type { DepartmentResponse } from '../types';

interface GetAllDepartmentsProps {
  clientId: string;
  onBack?: () => void;
  onCreate?: () => void;
  onDepartmentClick?: (department: DepartmentResponse) => void;
}

const DEPARTMENTS_PER_PAGE = 10;

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const GetAllDepartments = ({ clientId, onCreate, onDepartmentClick }: GetAllDepartmentsProps) => {
  const [departmentToUpdate, setDepartmentToUpdate] = useState<DepartmentResponse | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: departments = [],
    error,
    isLoading,
    // isRefetching,
    // refetch,
  } = useDepartmentsByClient(clientId);
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  const { mutate: deleteDepartment } = useDeleteDepartment();

  const totalPages = Math.max(1, Math.ceil(departments.length / DEPARTMENTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDepartments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * DEPARTMENTS_PER_PAGE;
    return departments.slice(startIndex, startIndex + DEPARTMENTS_PER_PAGE);
  }, [departments, safeCurrentPage]);

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
          toast.success('Department was updated.', 'Department updated');
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
      message: department.department_name + ' will be permanently removed.',
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
          toast.success(department.department_name + ' was deleted.', 'Department deleted');
          setDeletingDepartmentId(null);
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Delete failed');
          setDeletingDepartmentId(null);
        },
      },
    );
  };

  const columns: TableColumn<DepartmentResponse>[] = [
    {
      key: 'department',
      header: 'Department',
      accessor: (department) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900/50">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-gray-950 dark:text-white">
                {department.department_name}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="mt-0.5 block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
              {department.department_id}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (department) => (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {formatDate(department.created_at)}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Client ID',
      accessor: (department) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
          {department.client_id}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (department) => (
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Edit ' + department.department_name}
            className="h-9 w-9"
            onClick={() => openUpdateModal(department)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Delete ' + department.department_name}
            className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/25"
            disabled={deletingDepartmentId === department.department_id}
            onClick={() => handleDelete(department)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4 animate-in fade-in duration-300">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              Departments
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Department records and employee assignment entry points for this client.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* <Button
              type="button"
              variant="outline"
              icon={<RefreshCw className={'h-4 w-4 ' + (isRefetching ? 'animate-spin' : '')} />}
              disabled={isLoading}
              onClick={() => refetch()}
            >
              Refresh
            </Button> */}
            {onCreate && (
              <Button
                type="button"
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={onCreate}
              >
                Add Department
              </Button>
            )}
          </div>
        </div>
        <div className="grid border-b border-gray-200 dark:border-gray-800 sm:grid-cols-2">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:border-b-0 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Total departments
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {departments.length}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Current page
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {safeCurrentPage} / {totalPages}
            </p>
          </div>
        </div>
      </div>

      <Table
        data={paginatedDepartments}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage="No departments have been added to this client."
        rowKey="department_id"
        onRowClick={onDepartmentClick}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      <Modal
        isOpen={Boolean(departmentToUpdate)}
        onClose={() => setDepartmentToUpdate(null)}
        title="Update Department"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Input
            id="update-department-name"
            label="Department name"
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

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDepartmentToUpdate(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

