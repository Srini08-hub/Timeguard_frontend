import { type FormEvent, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useCreateEmployee } from '../hooks/useEmployees';

interface CreateEmployeeProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export const CreateEmployee = ({ onBack, onCreated }: CreateEmployeeProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { userId } = useAuth();
  const toast = useToast();
  const { mutate: createEmployee, isPending } = useCreateEmployee();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setError('All fields are required');
      toast.warning('Fill in all required fields before creating.', 'Missing details');
      return;
    }

    createEmployee(
      { name: trimmedName, email: trimmedEmail, created_by: userId },
      {
        onSuccess: (employee) => {
          setName('');
          setEmail('');
          setError('');
          toast.success(employee.name + ' was added successfully.', 'Employee created');
          onCreated?.();
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Create failed');
        },
      },
    );
  };

  return (
    <section className="space-y-5">
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
        >
          Back
        </Button>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">
              Add employee record
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a workforce identity for assignments and timesheet operations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="employee-name"
          name="name"
          label="Employee name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError('');
          }}
          error={error}
          placeholder="e.g. Priya Raman"
          disabled={isPending}
          fullWidth
        />

        <Input
          id="employee-email"
          name="email"
          type="email"
          label="Email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError('');
          }}
          error={error}
          placeholder="e.g. priya.raman@example.com"
          disabled={isPending}
          fullWidth
        />

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            icon={<UserPlus className="h-4 w-4" />}
          >
            Create Employee
          </Button>
        </div>
      </form>
    </section>
  );
};
