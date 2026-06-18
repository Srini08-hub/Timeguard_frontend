import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-blue-600 rounded-xl text-white mb-4 shadow-md shadow-blue-500/20">
            <Shield className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to TimeGuard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs font-normal leading-relaxed">
            Please authenticate to access the administration and control panels.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};
