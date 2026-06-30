import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl shadow-gray-950/10 p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-[var(--primary)] rounded-xl text-white mb-4 shadow-md shadow-blue-700/15">
            <Shield className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome to TimeGuard
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-xs font-normal leading-relaxed">
            Please authenticate to access the administration and control panels.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};
