import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useCreateUser } from '../hooks/useCreateUser';
import type { UserRole } from '../types';
import { UserPlus } from 'lucide-react';

export const CreateUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reviewer' as UserRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createUser, isPending, isError, error, isSuccess, reset } = useCreateUser();

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
    },
    onError: (error) => {
      console.error('Failed to create user:', error.message);
      alert(error.message);
    },
  });
};

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-150 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create User</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a new user to the system.</p>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm border border-green-200 dark:border-green-800 transition-all">
          User created successfully!
        </div>
      )}

      {isError && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800 transition-all">
          {error instanceof Error ? error.message : 'Failed to create user. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="John Doe"
          disabled={isPending}
          fullWidth
        />

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="john@example.com"
          disabled={isPending}
          fullWidth
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="••••••••"
          disabled={isPending}
          fullWidth
        />

        <Select
          label="Role"
          id="role"
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

        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isPending}
          >
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
};