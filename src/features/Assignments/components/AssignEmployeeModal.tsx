import { useState } from 'react';
import { UserRound, Mail, Check, IndianRupee } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
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

const isValidPayRate = (value: string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
};

export const AssignEmployeeModal = ({
  isOpen,
  onClose,
  departmentId,
  clientId,
}: AssignEmployeeModalProps) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [payRatesByEmployee, setPayRatesByEmployee] = useState<Record<string, string>>({});
  const toast = useToast();

  const { data: unassignedEmployees = [], isLoading } = useUnassignedEmployees();
  const { mutate: createAssignment, isPending } = useCreateAssignment();

  const selectedEmployeeIdList = Array.from(selectedEmployeeIds);
  const selectedEmployeesHavePayRates = selectedEmployeeIdList.every((empId) =>
    isValidPayRate(payRatesByEmployee[empId] ?? ''),
  );

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
        setPayRatesByEmployee((current) => {
          const { [empId]: _removed, ...rest } = current;
          return rest;
        });
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  const handlePayRateChange = (empId: string, value: string) => {
    setPayRatesByEmployee((current) => ({
      ...current,
      [empId]: value,
    }));
  };

  const handleAssign = () => {
    if (selectedEmployeeIds.size === 0) {
      toast.warning('Please select at least one employee.', 'No selection');
      return;
    }

    if (!selectedEmployeesHavePayRates) {
      toast.warning('Enter a pay rate greater than 0 for every selected employee.', 'Pay rate required');
      return;
    }

    const assignments: AssignmentCreate[] = selectedEmployeeIdList.map((empId) => ({
      emp_id: empId,
      client_id: clientId,
      department_id: departmentId,
      pay_rate: Number(payRatesByEmployee[empId]),
    }));

    createAssignment(assignments, {
      onSuccess: () => {
        toast.success(
          `${selectedEmployeeIds.size} employee(s) assigned successfully.`,
          'Assignment complete'
        );
        setSelectedEmployeeIds(new Set());
        setPayRatesByEmployee({});
        onClose();
      },
      onError: (error) => {
        toast.error(error.message, 'Assignment failed');
      },
    });
  };

  const handleClose = () => {
    setSelectedEmployeeIds(new Set());
    setPayRatesByEmployee({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Employees" size="lg">
      <div className="space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="h-8 w-8 text-[var(--primary)]" />
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Loading unassigned employees...
            </p>
          </div>
        ) : unassignedEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card-soft)] p-10 text-center">
            <UserRound className="mx-auto h-9 w-9 text-[var(--text-muted)]" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              No unassigned employees
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              All employees are already assigned to departments.
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto rounded-xl border border-[var(--border-color)]">
              <div className="divide-y divide-[var(--border-color)]">
                {unassignedEmployees.map((employee) => {
                  const isSelected = selectedEmployeeIds.has(employee.empId);
                  const payRateValue = payRatesByEmployee[employee.empId] ?? '';

                  return (
                    <div
                      key={employee.empId}
                      className="grid gap-4 p-4 transition-colors hover:bg-[var(--bg-card-soft)] sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEmployee(employee.empId)}
                          className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                          aria-label={'Select ' + employee.name}
                        />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
                          {employee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {employee.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                        )}
                      </div>

                      <Input
                        label="Pay Rate"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={payRateValue}
                        onChange={(event) => handlePayRateChange(employee.empId, event.target.value)}
                        placeholder="0.00"
                        icon={<IndianRupee className="h-4 w-4" />}
                        fullWidth
                        required={isSelected}
                        disabled={!isSelected || isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5">
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
                disabled={
                  selectedEmployeeIds.size === 0 ||
                  !selectedEmployeesHavePayRates
                }
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
