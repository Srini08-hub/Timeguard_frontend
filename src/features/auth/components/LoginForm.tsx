import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/80 p-3 text-sm text-[var(--danger-text)] animate-in fade-in duration-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Authentication Failed</p>
            <p className="mt-0.5 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="login-email" className="block text-xs font-medium text-slate-500">
          Email Address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className={`h-9 w-full rounded-md border bg-white/[0.55] py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-500 focus:outline-hidden focus:ring-2 ${
              validationErrors.email
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                : 'border-slate-200/80 focus:border-cyan-300 focus:ring-cyan-200'
            }`}
            required
          />
        </div>
        {validationErrors.email && (
          <p className="text-xs font-medium text-[var(--danger-text)]">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="login-password" className="block text-xs font-medium text-slate-500">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            className={`h-9 w-full rounded-md border py-2 pl-9 pr-3 text-sm text-slate-800 transition placeholder:text-slate-500 focus:outline-hidden focus:ring-2 ${
              validationErrors.password
                ? 'border-red-300 bg-white/[0.55] shadow-sm focus:border-red-400 focus:ring-red-200'
                : 'border-transparent border-b-slate-300 bg-transparent shadow-none focus:border-cyan-300 focus:bg-white/[0.45] focus:ring-cyan-100'
            }`}
            required
          />
        </div>
        {validationErrors.password && (
          <p className="text-xs font-medium text-[var(--danger-text)]">{validationErrors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-sky-400 to-blue-400 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-sky-500 hover:to-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-white/[0.60] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};
