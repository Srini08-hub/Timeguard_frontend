import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Edit3,
  Mail,
  Plus,
  // RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { CreateEmployee } from './CreateEmployee';
import {
  useDeleteEmployee,
  useActiveEmployees,
  useInactiveEmployees,
  useUpdateEmployee,
} from '../hooks/useEmployees';
import type { EmployeeResponse } from '../types';

type EmployeeStatusFilter = 'active' | 'inactive';

const EMPLOYEES_PER_PAGE = 10;

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const GetAllEmployee = () => {
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [employeeToUpdate, setEmployeeToUpdate] =
    useState<EmployeeResponse | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updateError, setUpdateError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: activeEmployeeRecords = [],
    error: activeError,
    isLoading: isActiveLoading,
    // isRefetching: isActiveRefetching,
    // refetch: refetchActiveEmployees,
  } = useActiveEmployees();
  const {
    data: inactiveEmployeeRecords = [],
    error: inactiveError,
    isLoading: isInactiveLoading,
    // isRefetching: isInactiveRefetching,
    // refetch: refetchInactiveEmployees,
  } = useInactiveEmployees();
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();

  const employees =
    statusFilter === 'active' ? activeEmployeeRecords : inactiveEmployeeRecords;
  const error = statusFilter === 'active' ? activeError : inactiveError;
  const isLoading =
    statusFilter === 'active' ? isActiveLoading : isInactiveLoading;
  // const isRefetching =
  //   statusFilter === 'active' ? isActiveRefetching : isInactiveRefetching;
  // const refetchEmployees =
  //   statusFilter === 'active' ? refetchActiveEmployees : refetchInactiveEmployees;

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return employees;

    return employees.filter((employee) => {
      return [employee.name, employee.email, employee.empId]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [employees, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmployees = filteredEmployees.slice(
    (safeCurrentPage - 1) * EMPLOYEES_PER_PAGE,
    safeCurrentPage * EMPLOYEES_PER_PAGE,
  );

  const activeEmployees = activeEmployeeRecords.length;
  const inactiveEmployees = inactiveEmployeeRecords.length;
  const totalEmployees = activeEmployees + inactiveEmployees;

  const openUpdateModal = (employee: EmployeeResponse) => {
    setEmployeeToUpdate(employee);
    setUpdatedName(employee.name);
    setUpdatedEmail(employee.email);
    setUpdateError('');
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeToUpdate) return;

    const trimmedName = updatedName.trim();
    const trimmedEmail = updatedEmail.trim();
    if (!trimmedName || !trimmedEmail) {
      setUpdateError('All fields are required');
      toast.warning('Fill in all required fields.', 'Missing details');
      return;
    }

    updateEmployee(
      {
        empId: employeeToUpdate.empId,
        employeeData: { name: trimmedName, email: trimmedEmail },
      },
      {
        onSuccess: (employee) => {
          setEmployeeToUpdate(null);
          setUpdatedName('');
          setUpdatedEmail('');
          toast.success(employee.name + ' was updated.', 'Employee updated');
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Update failed');
        },
      },
    );
  };

  const handleDelete = async (employee: EmployeeResponse) => {
    const confirmed = await confirm({
      title: 'Delete employee?',
      message: employee.name + ' will be removed from the active employee list.',
      confirmText: 'Delete',
      cancelText: 'Keep employee',
      variant: 'danger',
    });

    if (!confirmed) return;

    deleteEmployee(employee.empId, {
      onSuccess: () => {
        toast.success(employee.name + ' was deleted.', 'Employee deleted');
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Delete failed');
      },
    });
  };

  const columns: TableColumn<EmployeeResponse>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (employee) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)] ring-1 ring-blue-100">
            {getInitials(employee.name) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-[var(--text-primary)]">
                {employee.name}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </div>
            <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
              <Mail className="h-3.5 w-3.5" />
              {employee.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (employee) => (
        <Badge variant={employee.isActive ? 'success' : 'neutral'}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    
    {
      key: 'created',
      header: 'Created',
      accessor: (employee) => formatDate(employee.createdAt),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (employee) => {
        if (statusFilter === 'inactive') {
          return <span className="sr-only">No actions available</span>;
        }

        return (
          <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={'Edit ' + employee.name}
              className="h-9 w-9"
              onClick={() => openUpdateModal(employee)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={'Delete ' + employee.name}
              className="h-9 w-9 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
              disabled={isDeleting}
              onClick={() => handleDelete(employee)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-5 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Employees
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Manage workforce records, operational status, and employee details.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* <Button
              type="button"
              variant="outline"
              icon={<RefreshCw className={'h-4 w-4 ' + (isRefetching ? 'animate-spin' : '')} />}
              disabled={isLoading}
              onClick={() => refetchEmployees()}
            >
              Refresh
            </Button> */}
            <Button
              type="button"
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Employee
            </Button>
          </div>
        </div>

        <div className="grid border-b border-[var(--border-color)] sm:grid-cols-3">
          <div className="border-b border-[var(--border-color)] px-5 py-4 sm:border-b-0 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Total employees
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {totalEmployees}
            </p>
          </div>
          <div className="border-b border-[var(--border-color)] px-5 py-4 sm:border-b-0 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Active records
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {activeEmployees}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Inactive records
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {inactiveEmployees}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-[12rem_minmax(0,1fr)] lg:max-w-2xl">
            <Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as EmployeeStatusFilter);
                setSearchTerm('');
                setCurrentPage(1);
              }}
              options={[
                { value: 'active', label: 'Active employees' },
                { value: 'inactive', label: 'Inactive employees' },
              ]}
              aria-label="Employee status"
              fullWidth
            />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, or employee ID"
              icon={<Search className="h-4 w-4" />}
              fullWidth
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <ShieldCheck className="h-4 w-4 text-[var(--success-text)]" />
            <span>{filteredEmployees.length} {statusFilter} records visible</span>
          </div>
        </div>
      </section>

      <Table
        data={paginatedEmployees}
        columns={columns}
        isLoading={isLoading}
        error={error?.message}
        emptyMessage={
          statusFilter === 'active'
            ? 'No active employees match the current search.'
            : 'No inactive employees match the current search.'
        }
        rowKey="empId"
        onRowClick={(employee) => navigate(employee.empId)}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Employee"
        size="lg"
      >
        <CreateEmployee onCreated={() => setIsCreateOpen(false)} />
      </Modal>

      <Modal
        isOpen={Boolean(employeeToUpdate)}
        onClose={() => setEmployeeToUpdate(null)}
        title="Update Employee"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Input
            id="update-employee-name"
            label="Employee name"
            value={updatedName}
            onChange={(event) => {
              setUpdatedName(event.target.value);
              if (updateError) setUpdateError('');
            }}
            error={updateError}
            placeholder="Employee name"
            disabled={isUpdating}
            fullWidth
          />

          <Input
            id="update-employee-email"
            label="Email"
            type="email"
            value={updatedEmail}
            onChange={(event) => {
              setUpdatedEmail(event.target.value);
              if (updateError) setUpdateError('');
            }}
            error={updateError}
            placeholder="Employee email"
            disabled={isUpdating}
            fullWidth
          />

          <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmployeeToUpdate(null)}
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
    </div>
  );
};
