import React, { useState } from 'react';
import { ArrowLeft, Sparkles, UserPlus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../hooks/useToast';
import { useCreateUser } from '../hooks/useCreateUser';
import type { UserRole } from '../types';

interface CreateUserFormProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export const CreateUserForm = ({ onBack, onCreated }: CreateUserFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reviewer' as UserRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const { mutate: createUser, isPending, isError, isSuccess, reset } = useCreateUser();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (isError || isSuccess) {
      reset();
    }
  };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;

  createUser(formData, {
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'reviewer',
      });
      setErrors({});
      toast.success(`${formData.name} was added successfully.`, 'User created');
      onCreated?.();
    },
    onError: (error) => {
      toast.error(error.message, 'Create failed');
    },
  });
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
          User setup
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
                Create User
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a new user to the system with appropriate access roles.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <label
              htmlFor="user-name"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Full name
            </label>
            <Input
              id="user-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="e.g. John Doe"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="user-email"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Email address
            </label>
            <Input
              id="user-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="e.g. john@example.com"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="user-password"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Password
            </label>
            <Input
              id="user-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="user-role"
              className="text-sm font-semibold text-gray-750 dark:text-gray-200"
            >
              Role
            </label>
            <Select
              id="user-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: 'OpsAdmin', label: 'OpsAdmin' },
                { value: 'reviewer', label: 'Reviewer' }
              ]}
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
              Create User
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};