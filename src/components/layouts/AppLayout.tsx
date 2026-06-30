import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
// import { ShieldAlert, LogIn } from 'lucide-react';
// import { Button } from '../ui';
import type { SidebarNavItem } from './Sidebar';

export interface AppLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
  };
  activePageTitle?: string;
  navitems?: SidebarNavItem[]
  onNavigate?: (href: string, label: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onLogout,
  user,
  activePageTitle = 'Dashboard',
  navitems,
  onNavigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);



  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Responsive Sidebar component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        activeItem={activePageTitle}
        navItems={navitems}
        onNavigate={onNavigate}
      />

      {/* Main App Layout container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header bar */}
        <TopBar
          title={activePageTitle}
          onMenuToggle={toggleSidebar}
          user={user}
          onLogout={onLogout}
        />

        {/* Scrollable Main Content area */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)] px-4 py-6 sm:px-6 md:py-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};