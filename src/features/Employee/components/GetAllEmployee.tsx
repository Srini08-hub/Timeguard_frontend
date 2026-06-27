import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Users,
  UserRoundPlus,
} from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../hooks/useToast';
import { CreateEmployee } from './CreateEmployee';
import { GetEmployee } from './GetEmployee';
import {
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from '../hooks/useEmployees';
import type { EmployeeResponse } from '../types';

type EmployeeView = 'options' | 'list' | 'create';

export const GetAllEmployee = () => {
  const [view, setView] = useState<EmployeeView>('options');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeToUpdate, setEmployeeToUpdate] =
    useState<EmployeeResponse | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updateError, setUpdateError] = useState('');

  const toast = useToast();
  const confirm = useConfirm();
  const {
    data: employees = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useEmployees();
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return employees;

    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(normalizedSearch),
    );
  }, [employees, searchTerm]);

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
          toast.success(`${employee.name} was updated.`, 'Employee updated');
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
      message: `${employee.name} will be removed from the active employee list.`,
      confirmText: 'Delete',
      cancelText: 'Keep employee',
      variant: 'danger',
    });

    if (!confirmed) return;

    deleteEmployee(employee.empId, {
      onSuccess: () => {
        toast.success(`${employee.name} was deleted.`, 'Employee deleted');
      },
      onError: (requestError) => {
        toast.error(requestError.message, 'Delete failed');
      },
    });
  };

  const showList = () => setView('list');
  const showCreate = () => setView('create');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Employees
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Manage employee records used across Timeguard assignments.
          </p>
        </div>

        {view !== 'options' && (
          <Button type="button" variant="outline" onClick={() => setView('options')}>
            Employee Options
          </Button>
        )}
      </div>

      {view === 'options' && (
        <section className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={showList}
            className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-650 dark:bg-blue-950/35 dark:text-blue-300">
                <Users className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {employees.length} active
              </span>
            </div>
            <h2 className="mt-5 text-lg font-bold text-gray-950 dark:text-white">
              Get all users
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              View employees, search the list, and update or delete records.
            </p>
          </button>

          <button
            type="button"
            onClick={showCreate}
            className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-900/60 dark:hover:bg-emerald-950/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-300">
              <UserRoundPlus className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-gray-950 dark:text-white">
              Create user
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Add a new employee without leaving the operations dashboard.
            </p>
          </button>
        </section>
      )}

      {view === 'create' && (
        <CreateEmployee
          onBack={() => setView('options')}
          onCreated={() => setView('list')}
        />
      )}

      {view === 'list' && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Available Employees ({filteredEmployees.length})
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="w-full sm:w-72">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search employees"
                  icon={<Search className="h-4 w-4" />}
                  fullWidth
                />
              </div>
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
              <Button
                type="button"
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={showCreate}
              >
                Create
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
              <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Loading employees...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-950/30 dark:bg-red-950/10">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-400">
                Failed to load employees
              </h3>
              <p className="mt-1 text-xs text-red-650 dark:text-red-500">
                {error.message}
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-250 bg-gray-50/60 p-10 text-center dark:border-gray-800 dark:bg-gray-900/20">
              <Users className="mx-auto h-9 w-9 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                No employees found
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Create an employee or adjust your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredEmployees.map((employee) => (
                <GetEmployee
                  key={employee.empId}
                  employee={employee}
                  onUpdate={openUpdateModal}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        isOpen={Boolean(employeeToUpdate)}
        onClose={() => setEmployeeToUpdate(null)}
        title="Update Employee"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="update-employee-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Employee name
            </label>
            <Input
              id="update-employee-name"
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
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-employee-email"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Email
            </label>
            <Input
              id="update-employee-email"
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
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmployeeToUpdate(null)}
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
