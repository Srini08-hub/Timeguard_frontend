import React from 'react';
import { AppLayout } from '../../../components/layouts';
import { useAuth, useLogout } from '../../auth/hooks';
import { Briefcase } from 'lucide-react';

const OperationManger: React.FC = () => {
  const { userId } = useAuth();
  const { logout } = useLogout();

  return (
    <AppLayout
      onLogout={logout}
      user={{
        name: 'Operations Manager',
        email: 'ops@timeguard.com',
      }}
      activePageTitle="Operations Dashboard"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-8 shadow-xs flex flex-col items-center text-center max-w-2xl mx-auto my-12 animate-in fade-in duration-200">
        <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-full text-green-600 dark:text-green-400 mb-6">
          <Briefcase className="h-12 w-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Operations Manager Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Welcome back! You are logged in with the <strong>Operation Manager</strong> role (User ID: <span className="font-mono text-xs">{userId}</span>).
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Time logs approval and projects management metrics are loaded.
        </p>
      </div>
    </AppLayout>
  );
};

export default OperationManger;
