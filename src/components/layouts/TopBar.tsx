import React from 'react';
import { CalendarDays, Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import type { UserMenuProps } from './UserMenu';
import { Button } from '../ui';

export interface TopBarProps {
  title?: string;
  onMenuToggle: () => void;
  user?: UserMenuProps['user'];
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'Dashboard',
  onMenuToggle,
  user,
  onLogout,
}) => {
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-header)] px-4 shadow-sm shadow-gray-950/5 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-header)] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
          className="h-10 w-10 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
            {/* <Badge variant="primary" className="hidden sm:inline-flex">Production</Badge> */}
          </div>
          <p className="hidden truncate text-xs text-[var(--text-muted)] sm:block">
            TimeGuard operations workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* <div className="hidden w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 xl:flex">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search workspace</span>
        </div> */}

        <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] shadow-sm shadow-gray-950/5 lg:flex">
          <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
          <span>{formattedDate}</span>
        </div>

        {/* <Button
          variant="ghost"
          size="icon"
          aria-label="View notifications"
          className="relative h-10 w-10 text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-950" />
        </Button> */}

        <div className="h-8 w-px bg-[var(--border-color)]" />

        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};
