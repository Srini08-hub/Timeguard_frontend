import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export interface UserMenuProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
  },
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown if user clicks outside of user menu container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-lg object-cover ring-2 ring-gray-100 dark:ring-gray-800"
          />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-sm font-semibold tracking-wider">
            {getInitials(user.name)}
          </div>
        )}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            {user.name}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {user.email}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 md:hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {user.email}
            </p>
          </div>

          <a
            href="#profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </a>

          <a
            href="#settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>

          <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onLogout) onLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-650 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};
