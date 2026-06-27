import { Edit3, Mail, Trash2, UserRound } from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { UserInfo } from '../types';

interface GetUserProps {
  user: UserInfo;
  onUpdate: (user: UserInfo) => void;
  onDelete: (user: UserInfo) => void;
  isDeleting?: boolean;
}

export const GetUser = ({
  user,
  onUpdate,
  onDelete,
  isDeleting = false,
}: GetUserProps) => {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'OpsAdmin') return 'info';
    if (role === 'reviewer') return 'success';
    return 'neutral';
  };

  return (
    <article className="group rounded-xl border border-gray-100 bg-white p-4 shadow-2xs transition-all hover:border-blue-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">
            {initials || <UserRound className="h-5 w-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-950 dark:text-white">
                {user.name}
              </h3>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-450">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
              <span className="font-mono">ID: {user.user_id}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Edit3 className="h-4 w-4" />}
            onClick={() => onUpdate(user)}
          >
            Update
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            isLoading={isDeleting}
            onClick={() => onDelete(user)}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
};
