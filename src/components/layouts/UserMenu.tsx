import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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
        className="flex h-10 items-center gap-2 rounded-lg border border-transparent px-1.5 transition-colors hover:border-[var(--border-color)] hover:bg-[var(--bg-card-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] cursor-pointer"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-lg object-cover ring-1 ring-[var(--border-color)]"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-semibold tracking-wide text-white shadow-sm shadow-blue-700/15">
            {getInitials(user.name)}
          </div>
        )}
        <div className="hidden min-w-0 flex-col text-left md:flex">
          <span className="max-w-32 truncate text-xs font-semibold text-[var(--text-primary)]">
            {user.name}
          </span>
          <span className="max-w-32 truncate text-xs text-[var(--text-muted)]">
            {user.email}
          </span>
        </div>
        <ChevronDown className={`hidden h-4 w-4 text-[var(--text-muted)] transition-transform md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] py-2 shadow-xl shadow-gray-950/10">
          <div className="border-b border-[var(--border-color)] bg-[var(--bg-card-soft)] px-4 pb-3 pt-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {user.email}
            </p>
          </div>

          <a
            href="#profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]"
          >
            <User className="h-4 w-4 text-[var(--text-muted)]" />
            <span>My Profile</span>
          </a>

          {/* <a
            href="#settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
          >
            <Settings className="h-4 w-4 text-gray-400" />
            <span>Settings</span>
          </a> */}

          <div className="my-1 border-t border-[var(--border-color)]" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onLogout) onLogout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--danger-text)] transition-colors hover:bg-[var(--danger-bg)] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};
