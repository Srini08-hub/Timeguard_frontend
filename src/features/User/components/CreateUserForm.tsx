import React, { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';

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
    if (isError || isSuccess) reset();
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
        toast.success(formData.name + ' was added successfully.', 'User created');
        onCreated?.();
      },
      onError: (error) => {
        const message = (error as any).response?.data?.detail ?? (error as any).response?.data?.message ?? error.message;
        toast.error(message, 'Create failed');
      },
    });
  };

  return (
    <section className="animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm shadow-gray-950/5">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Create User
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Add a user account and assign an access role.
                </p>
              </div>
            </div>
            {onBack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={onBack}
              >
                Back
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="user-name"
              name="name"
              label="Full name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="e.g. John Doe"
              disabled={isPending}
              fullWidth
            />

            <Input
              id="user-email"
              name="email"
              label="Email address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="e.g. john@example.com"
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="user-password"
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter a secure password"
              disabled={isPending}
              fullWidth
            />

            <Select
              id="user-role"
              name="role"
              label="Role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: 'OpsAdmin', label: 'OpsAdmin' },
                { value: 'reviewer', label: 'Reviewer' },
              ]}
              disabled={isPending}
              fullWidth
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-color)] pt-5 sm:flex-row sm:justify-end">
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
