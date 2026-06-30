import { useState } from 'react';
import { ArrowLeft, UsersRound } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { CreateUserForm } from './CreateUserForm';
import { GetAllUsers } from './GetAllUsers';

type UserView = 'list' | 'create';

export const User = () => {
  const [view, setView] = useState<UserView>('list');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 border-b border-[var(--border-color)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15">
            <UsersRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Users
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Manage system users and their access roles.
            </p>
          </div>
        </div>

        {view === 'create' && (
          <Button
            type="button"
            variant="outline"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => setView('list')}
          >
            Back to Users
          </Button>
        )}
      </div>

      {view === 'create' ? (
        <CreateUserForm
          onBack={() => setView('list')}
          onCreated={() => setView('list')}
        />
      ) : (
        <GetAllUsers onCreate={() => setView('create')} />
      )}
    </div>
  );
};
