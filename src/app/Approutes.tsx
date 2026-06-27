import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoutes';
import { LoginPage } from '../features/auth/pages/LoginPage';
import Admin from '../features/Dashboard/pages/Admin';
import OpsAdmin from '../features/Dashboard/pages/OpsAdmin';
import Reviewer from '../features/Dashboard/pages/Reviewer';
import { User } from '../features/User/components/Users';
import { TimesheetPending } from '../features/Timesheet/components/TimesheetPending';
import { GetAllEmployee } from '../features/Employee/components/GetAllEmployee';
import { GetEmployee } from '../features/Employee/components/GetEmployee';
import { Clients } from '../features/Client/components/Clients';
import { ClientDetails } from '../features/Client/components/ClientDetails';
import { DepartmentDetails } from '../features/Department/components/DepartmentDetails';
import { MailInbox } from '../features/Emails/components/MailInbox';
import { MailDetails } from '../features/Emails/components/MailDetails';

const AppRoutes: React.FC = () => {
  const { userId, role } = useAuth();

  const getDefaultRoute = () => {
    if (!userId) return '/login';
    if (role === 'admin') return '/admin/user';
    if (role === 'OpsAdmin') return '/ops-admin';
    if (role === 'reviewer') return '/reviewer';
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<User />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['OpsAdmin']} />}>
        <Route path="/ops-admin" element={<OpsAdmin />}>
          <Route index element={<Navigate to="employees" replace />} />
          <Route path="employees" element={<GetAllEmployee />} />
          <Route path="employees/:empId" element={<GetEmployee />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientDetails />} />
          <Route path="clients/:clientId/departments/:departmentId" element={<DepartmentDetails />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['reviewer']} />}>
        <Route path="/reviewer" element={<Reviewer />}>
          <Route index element={<Navigate to="timesheets-pending" replace />} />
          <Route path="timesheets-pending" element={<TimesheetPending />} />
          <Route path="emails" element={<MailInbox />} />
          <Route path="emails/:emailId" element={<MailDetails />} />
          <Route path="timesheet-emails" element={<Navigate to="/reviewer/emails" replace />} />
          <Route path="non-timesheet-emails" element={<Navigate to="/reviewer/emails" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;

