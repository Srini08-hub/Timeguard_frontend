import { useMemo, useState } from 'react';
import { UserRound, Mail, Trash2 } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { Spinner } from '../../../components/ui/Spinner';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { useAssignmentsByDepartment, useDeleteAssignment } from '../hooks/useAssignments';
import { useEmployees } from '../../Employee/hooks/useEmployees';
import type { AssignmentResponse } from '../types';

interface AssignedEmployeesProps {
  departmentId: string;
  clientId: string;
}

export const AssignedEmployees = ({ departmentId, clientId }: AssignedEmployeesProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const itemsPerPage = 5;

  const toast = useToast();
  const confirm = useConfirm();

  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignmentsByDepartment(departmentId);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { mutate: deleteAssignment } = useDeleteAssignment();

  const assignedEmployees = useMemo(() => {
    const empIds = assignments.map((a) => a.emp_id);
    return employees.filter((emp) => empIds.includes(emp.empId));
  }, [assignments, employees]);

  const getAssignmentForEmployee = (empId: string) => {
    return assignments.find((a) => a.emp_id === empId );
  };

  const totalPages = Math.ceil(assignedEmployees.length / itemsPerPage);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return assignedEmployees.slice(startIndex, endIndex);
  }, [assignedEmployees, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRemove = async (assignment: AssignmentResponse) => {
    const confirmed = await confirm({
      title: 'Remove Employee',
      message: 'Are you sure you want to remove this employee from the department?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setDeletingAssignmentId(assignment.assignment_id);

    deleteAssignment(
      { assignmentId: assignment.assignment_id, departmentId },
      {
        onSuccess: () => {
          toast.success('Employee removed from department successfully.', 'Removed');
          setDeletingAssignmentId(null);
          
        },
        onError: (error) => {
          toast.error(error.message, 'Failed to remove');
          setDeletingAssignmentId(null);
        },
      },
    );
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  if (assignmentsLoading || employeesLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
        <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Loading assigned employees...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Assigned Employees ({assignedEmployees.length})
        </h3>
      </div>

      {assignedEmployees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-250 bg-gray-50/60 p-10 text-center dark:border-gray-800 dark:bg-gray-900/20">
          <UserRound className="mx-auto h-9 w-9 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            No employees assigned
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Assign employees to this department to see them here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {paginatedEmployees.map((employee) => {
              const assignment = getAssignmentForEmployee(employee.empId,employee.isActive);
              return (
                <article
                  key={employee.empId}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-sm font-bold text-purple-700 dark:bg-purple-950/35 dark:text-purple-300">
                      {employee.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-gray-950 dark:text-white">
                        {employee.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(employee.createdAt)}
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      isLoading={deletingAssignmentId === assignment?.assignment_id}
                      onClick={() => assignment && handleRemove(assignment)}
                    >
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })}
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
    </div>
  );
};
