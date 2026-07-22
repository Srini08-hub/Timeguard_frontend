import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppLayout } from '../../../components/layouts';
import { useAuth, useLogout } from '../../auth/hooks';
import { RadioTower, SlidersHorizontal, Users } from 'lucide-react';

const OpsAdminNavItems = [
  { label: 'Employees', href: 'employees', icon: Users },
  { label: 'Clients', href: 'clients', icon: Users },
  { label: 'Polling', href: 'polling', icon: RadioTower },
  { label: 'Extraction Strategy', href: 'extraction-strategy', icon: SlidersHorizontal },
];

const OpsAdmin: React.FC = () => {
  const { name, email } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  const activePageTitle =
    OpsAdminNavItems.find((item) =>
      location.pathname.includes('/ops-admin/' + item.href),
    )?.label ?? 'Operations Manager';

  return (
    <AppLayout
      onLogout={logout}
      user={{
        name: name || 'OpsAdmin',
        email: email || 'ops@timeguard.com',
      }}
      activePageTitle={activePageTitle}
      navitems={OpsAdminNavItems}
      onNavigate={handleNavigate}
    >
      <main>
        <Outlet />
      </main>
    </AppLayout>
  );
};

export default OpsAdmin;

