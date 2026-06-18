import React from 'react';
import { AppLayout } from '../../../components/layouts';
import { useAuth, useLogout } from '../../auth/hooks';
import { ClipboardList } from 'lucide-react';

const Reviewer: React.FC = () => {
  const { userId } = useAuth();
  const { logout } = useLogout();

  return (
    <AppLayout
      onLogout={logout}
      user={{
        name: 'Expert Reviewer',
        email: 'reviewer@timeguard.com',
      }}
      activePageTitle="Reviewer Dashboard"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-8 shadow-xs flex flex-col items-center text-center max-w-2xl mx-auto my-12 animate-in fade-in duration-200">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-full text-amber-650 dark:text-amber-400 mb-6">
          <ClipboardList className="h-12 w-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reviewer Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Welcome back! You are logged in with the <strong>Reviewer</strong> role (User ID: <span className="font-mono text-xs">{userId}</span>).
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Pending timesheet queues are synced and ready for review.
        </p>
      </div>
    </AppLayout>
  );
};

export default Reviewer;
