import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppLayout } from '../../../components/layouts';
import { useAuth, useLogout } from '../../auth/hooks';
import { Database, Mail, ClipboardList } from 'lucide-react';

const reviewerItems = [
  { label: 'Timesheets', href: 'timesheets', icon: Database },
  { label: 'Timecards', href: 'timecards', icon: ClipboardList },
  { label: 'Mail', href: 'emails', icon: Mail },
];

const Reviewer: React.FC = () => {
  const { name, email } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  const activePageTitle = location.pathname.includes('/emails')
    ? 'Mail'
    : location.pathname.includes('/timecards') && !location.pathname.includes('/exception')
      ? 'Timecards'
      : location.pathname.includes('/timesheets')
        ? 'Timesheets'
        : reviewerItems.find((item) => item.href === (location.pathname.split('/').pop() ?? ''))?.label ?? 'Reviewer';

  return (
    <AppLayout
      onLogout={logout}
      user={{
        name: name || 'Reviewer',
        email: email || 'rev@timeguard.com',
      }}
      activePageTitle={activePageTitle}
      navitems={reviewerItems}
      onNavigate={handleNavigate}
    >
      <main className="">
        <Outlet />
      </main>
    </AppLayout>
  );
};

export default Reviewer;