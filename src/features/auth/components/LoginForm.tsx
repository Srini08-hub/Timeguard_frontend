import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import { Input, Button } from '../../../components/ui';
import { useLogin } from '../hooks/useLogin';

export const LoginForm: React.FC = () => {
  const { login, isLoading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ email, password });
    } catch (err) {
      // Error is handled in the useLogin hook state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-[var(--danger-bg)] border border-red-200 rounded-lg flex items-start gap-3 text-[var(--danger-text)] text-sm animate-in fade-in duration-200">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Failed</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (validationErrors.email) {
            setValidationErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        error={validationErrors.email}
        icon={<Mail className="h-4 w-4" />}
        fullWidth
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (validationErrors.password) {
            setValidationErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={validationErrors.password}
        icon={<Lock className="h-4 w-4" />}
        fullWidth
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full justify-center mt-2 cursor-pointer shadow-sm shadow-blue-700/15 hover:shadow-blue-700/20"
      >
        Sign In
      </Button>
    </form>
  );
};
