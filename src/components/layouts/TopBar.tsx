import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { UserMenu } from './UserMenu';
import type { UserMenuProps } from './UserMenu'

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
  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger toggle */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle Navigation Menu"
          className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-gray-100 dark:bg-gray-800" />

        {/* User profile details dropdown */}
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};
