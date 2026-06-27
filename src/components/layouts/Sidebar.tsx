import React from 'react';
import {
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  Home,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge, Button } from '../ui';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  onNavigate?: (href: string, label: string) => void;
  navItems?: SidebarNavItem[];
}

const defaultNavItems: SidebarNavItem[] = [
  { label: 'Dashboard', href: '#dashboard', icon: Home },
  { label: 'Time Logs', href: '#time-logs', icon: Calendar },
  { label: 'Projects', href: '#projects', icon: Briefcase },
  { label: 'Tasks', href: '#tasks', icon: CheckSquare },
  { label: 'Reports', href: '#reports', icon: BarChart3, badge: 'New' },
  { label: 'System Settings', href: '#settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeItem = 'Dashboard',
  onNavigate,
  navItems = defaultNavItems,
}) => {
  const isExpanded = isOpen;

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, item: SidebarNavItem) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(item.href, item.label);
    }
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/55 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white text-gray-700 shadow-2xl shadow-gray-950/10 transition-all duration-300 ease-out dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 lg:static lg:h-screen lg:translate-x-0 lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:w-20'}
        `}
      >
        <div className={`flex h-16 items-center border-b border-gray-200 px-4 dark:border-gray-800 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className={`min-w-0 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'w-0 opacity-0 lg:hidden'}`}>
              <span className="block truncate text-sm font-semibold tracking-wide text-gray-950 dark:text-white">
                TimeGuard
              </span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                Workforce control
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar"
            className="h-9 w-9 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className={`px-4 pt-5 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/25">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Operations
              </span>
              <Badge variant="success">Live</Badge>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-950 dark:text-white">
              Admin Console
            </p>
          </div>
        </div>

        <nav className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-5 ${isExpanded ? 'px-4' : 'px-3'}`} aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <a
                key={item.label}
                href={item.href}
                title={item.label}
                onClick={(e) => handleItemClick(e, item)}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex min-h-11 items-center rounded-lg text-sm font-medium transition-all duration-200
                  ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5'}
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/45 dark:text-blue-300 dark:ring-blue-900/70'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {isActive && (
                  <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 ${isExpanded ? '' : 'lg:left-1'}`} />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors
                    ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}
                  `}
                />
                <span className={`min-w-0 flex-1 truncate whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100' : 'w-0 opacity-0 lg:hidden'}`}>
                  {item.label}
                </span>
                {item.badge && isExpanded && (
                  <Badge variant={isActive ? 'primary' : 'neutral'} className="shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </a>
            );
          })}
        </nav>

        <div className={`border-t border-gray-200 p-4 dark:border-gray-800 ${isExpanded ? '' : 'hidden lg:block'}`}>
          {isExpanded ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                  Enterprise Edition
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  v1.0.0
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Sparkles className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
