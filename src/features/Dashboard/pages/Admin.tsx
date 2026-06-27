import React from 'react';
import { useNavigate,useLocation,Outlet } from 'react-router-dom';
import { AppLayout } from '../../../components/layouts';
import { useAuth, useLogout } from '../../auth/hooks';
import {  Users } from 'lucide-react';
const adminNavItems = [
  { label: 'Users', href: 'users', icon: Users },
  // { label: 'Profile', href: 'profile', icon: Shield },

];

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleNavigate = (href: string) => {
    navigate(href);
  };
  const {name, email } = useAuth();
  const { logout } = useLogout();
  const currentPath =location.pathname.split('/').pop() ?? ''
  // console.log('Current Path:', currentPath); // Debugging line
  const activePageTitle =
    adminNavItems.find(
      item => item.href === currentPath
    )?.label ?? 'Admin';
  return (
    <AppLayout
      onLogout={logout}
      user={{
        name: name || 'Administrator',
        email: email || 'admin@timeguard.com',
      }}
      activePageTitle={activePageTitle}
      navitems={adminNavItems}
      onNavigate={handleNavigate}
    >
      <main className="">
        <Outlet />
      </main>
    </AppLayout>
  );
};

export default Admin;
