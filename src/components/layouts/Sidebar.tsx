import React from 'react';
import { Home, Calendar, Briefcase, CheckSquare, Settings, X, ShieldAlert } from 'lucide-react';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
  { label: 'System Settings', href: '#settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeItem = 'Dashboard',
  onNavigate,
  navItems = defaultNavItems,
}) => {
  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, item: SidebarNavItem) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(item.href, item.label);
    }
    onClose(); // Auto close on mobile navigation
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-45 bg-gray-900 text-gray-300 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out lg:static lg:h-screen
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Sidebar Header Brand Area */}
        <div className={`h-16 flex items-center px-6 border-b border-gray-850 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className={`text-base font-bold text-white tracking-wide transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0 lg:hidden'}`}>
              TimeGuard
            </span>
          </div>
          {/* Close button for mobile drawers */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1 overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleItemClick(e, item)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group cursor-pointer
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 hover:text-white text-gray-400'
                  }
                `}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition-colors flex-shrink-0
                    ${isActive ? 'text-white' : 'text-gray-450 group-hover:text-white'}
                  `}
                />
                <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 lg:hidden'}`}>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Sidebar footer branding */}
        <div className="p-4 border-t border-gray-850 text-center overflow-hidden">
          <p className={`text-[10px] text-gray-500 font-normal whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
            TimeGuard Admin v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};
