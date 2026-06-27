import { type FormEvent, useState } from 'react';
import { ArrowLeft, Sparkles, UserPlus } from 'lucide-react';

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
          toast.success(`${employee.name} was added successfully.`, 'Employee created');
          onCreated?.();
        },
        onError: (requestError) => {
          toast.error(requestError.message, 'Create failed');
        },
      },
    );
  };

  return (
    <section className="mx-auto w-full max-w-3xl animate-in fade-in duration-300">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
          className={onBack ? '' : 'invisible'}
        >
          Back
        </Button>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Employee setup
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-650 dark:bg-blue-950/35 dark:text-blue-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
                Create Employee
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a new active employee to Timeguard.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <label
              htmlFor="employee-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Employee name
            </label>
            <Input
              id="employee-name"
              name="name"
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
          </div>

          <div className="space-y-2">
            <label
              htmlFor="employee-email"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Email
            </label>
            <Input
              id="employee-email"
              name="email"
              type="email"
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
          </div>

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
      </div>
    </section>
  );
};
