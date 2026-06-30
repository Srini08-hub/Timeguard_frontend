import { useMemo, useState } from 'react';
import { CalendarDays, Check, IndianRupee, Mail, Pencil, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';

// import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { useActiveEmployees, useInactiveEmployees } from '../../Employee/hooks/useEmployees';
import type { EmployeeResponse } from '../../Employee/types';
import { useAssignmentsByDepartment, useDeleteAssignment, useUpdateAssignment } from '../hooks/useAssignments';
import type { AssignmentResponse } from '../types';

interface AssignedEmployeesProps {
  departmentId: string;
  clientId: string;
}

type AssignedEmployeeRow = EmployeeResponse & {
  assignment: AssignmentResponse;
};

const ASSIGNED_EMPLOYEES_PER_PAGE = 10;

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatCurrency = (value: number | string) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '\u20B90.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(numericValue);
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const AssignedEmployees = ({ departmentId }: AssignedEmployeesProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [payRateDraft, setPayRateDraft] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  const {
    data: assignments = [],
    error: assignmentsError,
    isLoading: assignmentsLoading,
  } = useAssignmentsByDepartment(departmentId);
  const { data: activeEmployees = [], isLoading: activeEmployeesLoading } = useActiveEmployees();
  const { data: inactiveEmployees = [], isLoading: inactiveEmployeesLoading } = useInactiveEmployees();
  const { mutate: deleteAssignment } = useDeleteAssignment();
  const { mutate: updateAssignment, isPending: isUpdatingAssignment } = useUpdateAssignment();

  const assignedEmployees = useMemo<AssignedEmployeeRow[]>(() => {
    const employeesById = new Map<string, EmployeeResponse>();
    [...activeEmployees, ...inactiveEmployees].forEach((employee) => {
      employeesById.set(employee.empId, employee);
    });

    return assignments
      .map((assignment) => {
        const employee = employeesById.get(assignment.emp_id);
        if (!employee) return null;
        return { ...employee, assignment };
      })
      .filter((employee): employee is AssignedEmployeeRow => Boolean(employee));
  }, [activeEmployees, assignments, inactiveEmployees]);

  const totalPages = Math.max(1, Math.ceil(assignedEmployees.length / ASSIGNED_EMPLOYEES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmployees = assignedEmployees.slice(
    (safeCurrentPage - 1) * ASSIGNED_EMPLOYEES_PER_PAGE,
    safeCurrentPage * ASSIGNED_EMPLOYEES_PER_PAGE,
  );

  const handleEditPayRate = (assignment: AssignmentResponse) => {
    setEditingAssignmentId(assignment.assignment_id);
    setPayRateDraft(String(assignment.pay_rate ?? ''));
  };

  const handleCancelEdit = () => {
    setEditingAssignmentId(null);
    setPayRateDraft('');
  };

  const handleSavePayRate = (assignment: AssignmentResponse, employeeName: string) => {
    const payRate = Number(payRateDraft);
    if (!Number.isFinite(payRate) || payRate <= 0) {
      toast.warning('Enter a pay rate greater than 0.', 'Invalid pay rate');
      return;
    }

    updateAssignment(
      {
        assignmentId: assignment.assignment_id,
        assignmentData: { pay_rate: payRate },
      },
      {
        onSuccess: () => {
          toast.success(employeeName + ' pay rate was updated.', 'Pay rate updated');
          handleCancelEdit();
        },
        onError: (error) => {
          toast.error(error.message, 'Failed to update pay rate');
        },
      },
    );
  };

  const handleRemove = async (assignment: AssignmentResponse, employeeName: string) => {
    const confirmed = await confirm({
      title: 'Remove employee?',
      message: employeeName + ' will be removed from this department.',
      confirmText: 'Remove',
      cancelText: 'Keep assigned',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingAssignmentId(assignment.assignment_id);
    deleteAssignment(
      { assignmentId: assignment.assignment_id, departmentId },
      {
        onSuccess: () => {
          toast.success(employeeName + ' was removed from this department.', 'Employee removed');
          setDeletingAssignmentId(null);
        },
        onError: (error) => {
          toast.error(error.message, 'Failed to remove');
          setDeletingAssignmentId(null);
        },
      },
    );
  };

  const columns: TableColumn<AssignedEmployeeRow>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (employee) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)] ring-1 ring-blue-100">
            {getInitials(employee.name) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">
              {employee.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">
              {employee.empId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: (employee) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <Mail className="h-4 w-4 text-[var(--text-muted)]" />
          {employee.email}
        </span>
      ),
    },
    {
      key: 'payRate',
      header: 'Pay Rate',
      accessor: (employee) => {
        const isEditing = editingAssignmentId === employee.assignment.assignment_id;
        if (isEditing) {
          return (
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={payRateDraft}
              onChange={(event) => setPayRateDraft(event.target.value)}
              icon={<IndianRupee className="h-4 w-4" />}
              className="w-32"
              aria-label="Pay rate"
            />
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <IndianRupee className="h-4 w-4 text-[var(--text-muted)]" />
            {formatCurrency(employee.assignment.pay_rate)}
          </span>
        );
      },
    },
    {
      key: 'assignedOn',
      header: 'Assigned On',
      accessor: (employee) => (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
          {formatDate(employee.assignment.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (employee) => {
        const isEditing = editingAssignmentId === employee.assignment.assignment_id;

        if (isEditing) {
          return (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cancel pay rate edit"
                className="h-9 w-9"
                disabled={isUpdatingAssignment}
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="primary"
                size="icon"
                aria-label="Save pay rate"
                className="h-9 w-9"
                isLoading={isUpdatingAssignment}
                onClick={() => handleSavePayRate(employee.assignment, employee.name)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          );
        }

        return (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={'Edit pay rate for ' + employee.name}
              className="h-9 w-9"
              onClick={() => handleEditPayRate(employee.assignment)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={'Remove ' + employee.name}
              className="h-9 w-9 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
              isLoading={deletingAssignmentId === employee.assignment.assignment_id}
              onClick={() => handleRemove(employee.assignment, employee.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const isLoading = assignmentsLoading || activeEmployeesLoading || inactiveEmployeesLoading;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Assigned Employees
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Review employee assignment status and remove employees from this department.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-soft)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)]">
            <ShieldCheck className="h-4 w-4 text-[var(--success-text)]" />
            {assignedEmployees.length} assigned
          </div>
        </div>
      </div>

      <Table
        data={paginatedEmployees}
        columns={columns}
        isLoading={isLoading}
        error={assignmentsError?.message}
        emptyMessage="No employees are assigned to this department."
        rowKey={(employee) => employee.assignment.assignment_id}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </section>
  );
};
