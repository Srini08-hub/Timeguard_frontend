import { useState } from 'react';
import { UserRound, Mail, Check } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { useUnassignedEmployees } from '../../Employee/hooks/useEmployees';
import { useCreateAssignment } from '../hooks/useAssignments';
import type { AssignmentCreate } from '../types';

interface AssignEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  clientId: string;
}

export const AssignEmployeeModal = ({
  isOpen,
  onClose,
  departmentId,
  clientId,
}: AssignEmployeeModalProps) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  const { data: unassignedEmployees = [], isLoading } = useUnassignedEmployees();
  const { mutate: createAssignment, isPending } = useCreateAssignment();

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(empId)) {
        newSet.delete(empId);
      } else {
        newSet.add(empId);
      }
      return newSet;
    });
  };

  const handleAssign = () => {
    if (selectedEmployeeIds.size === 0) {
      toast.warning('Please select at least one employee.', 'No selection');
      return;
    }

    const assignments: AssignmentCreate[] = Array.from(selectedEmployeeIds).map((empId) => ({
      emp_id: empId,
      client_id: clientId,
      department_id: departmentId,
    }));

    createAssignment(assignments, {
      onSuccess: () => {
        toast.success(
          `${selectedEmployeeIds.size} employee(s) assigned successfully.`,
          'Assignment complete'
        );
        setSelectedEmployeeIds(new Set());
        onClose();
      },
      onError: (error) => {
        toast.error(error.message, 'Assignment failed');
      },
    });
  };

  const handleClose = () => {
    setSelectedEmployeeIds(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Employees" size="lg">
      <div className="space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Loading unassigned employees...
            </p>
          </div>
        ) : unassignedEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-250 bg-gray-50/60 p-10 text-center dark:border-gray-800 dark:bg-gray-900/20">
            <UserRound className="mx-auto h-9 w-9 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
              No unassigned employees
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              All employees are already assigned to departments.
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {unassignedEmployees.map((employee) => {
                  const isSelected = selectedEmployeeIds.has(employee.empId);
                  return (
                    <label
                      key={employee.empId}
                      className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleEmployee(employee.empId)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
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
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAssign}
                isLoading={isPending}
                disabled={selectedEmployeeIds.size === 0}
              >
                Assign {selectedEmployeeIds.size > 0 && `(${selectedEmployeeIds.size})`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
