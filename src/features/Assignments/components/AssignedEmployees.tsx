import { useMemo, useState } from 'react';
import { CalendarDays, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react';

// import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type TableColumn } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { useActiveEmployees, useInactiveEmployees } from '../../Employee/hooks/useEmployees';
import type { EmployeeResponse } from '../../Employee/types';
import { useAssignmentsByDepartment, useDeleteAssignment } from '../hooks/useAssignments';
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

export const AssignedEmployees = ({ departmentId }: AssignedEmployeesProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900/50">
            {getInitials(employee.name) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-950 dark:text-white">
              {employee.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
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
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <Mail className="h-4 w-4 text-gray-400" />
          {employee.email}
        </span>
      ),
    },
    // {
    //   key: 'assignmentStatus',
    //   header: 'Assignment',
    //   accessor: (employee) => (
    //     <Badge variant={employee.assignment.status === 'active' ? 'success' : 'neutral'}>
    //       {employee.assignment.status === 'active' ? 'Active' : 'Inactive'}
    //     </Badge>
    //   ),
    // },
    // {
    //   key: 'employeeStatus',
    //   header: 'Employee Status',
    //   accessor: (employee) => (
    //     <Badge variant={employee.isActive ? 'info' : 'neutral'}>
    //       {employee.isActive ? 'Available' : 'Inactive'}
    //     </Badge>
    //   ),
    // },
    {
      key: 'assignedOn',
      header: 'Assigned On',
      accessor: (employee) => (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {formatDate(employee.assignment.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      accessor: (employee) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={'Remove ' + employee.name}
            className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/25"
            isLoading={deletingAssignmentId === employee.assignment.assignment_id}
            onClick={() => handleRemove(employee.assignment, employee.name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const isLoading = assignmentsLoading || activeEmployeesLoading || inactiveEmployeesLoading;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              Assigned Employees
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review employee assignment status and remove employees from this department.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
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
