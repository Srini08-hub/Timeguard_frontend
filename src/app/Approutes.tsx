import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoutes';
import { LoginPage } from '../features/auth/pages/LoginPage';
import Admin from '../features/Dashboard/pages/Admin';
import OpsAdmin from '../features/Dashboard/pages/OpsAdmin';
import Reviewer from '../features/Dashboard/pages/Reviewer';
import { User } from '../features/User/components/Users';
import { TimeSheet } from '../features/Emails/components/TimeSheet';
import  {NonTimeSheet}  from '../features/Emails/components/NonTimesheet';
import {TimesheetPending} from '../features/Timesheet/components/TimesheetPending';
import { GetAllEmployee } from '../features/Employee/components/GetAllEmployee';
import { GetEmployee } from '../features/Employee/components/GetEmployee';
import { Clients } from '../features/Client/components/Clients';
import { ClientDetails } from '../features/Client/components/ClientDetails';
import { DepartmentDetails } from '../features/Department/components/DepartmentDetails';
const AppRoutes: React.FC = () => {
  const { userId, role } = useAuth();
  const getDefaultRoute = () => {
    if (!userId) return '/login'
    if (role === 'admin') return '/admin/user'
    if (role === 'OpsAdmin') return '/ops-admin'
    if (role === 'reviewer') return '/reviewer'
    return '/login'
  }
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<User />} />
        </Route>

      </Route>

      <Route element={<ProtectedRoute allowedRoles={['OpsAdmin']} />}>
        <Route path="/ops-admin" element={<OpsAdmin />} >
          <Route index element={<Navigate to="employees" replace />} />
          <Route path="employees" element={<GetAllEmployee />} />
          <Route path="employees/:empId" element={<GetEmployee />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientDetails />} />
          <Route path="clients/:clientId/departments/:departmentId" element={<DepartmentDetails />} />
          <Route path="timesheet-emails" element={<TimeSheet />} />
          <Route path="non-timesheet-emails" element={<NonTimeSheet />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['reviewer']} />}>
        <Route path="/reviewer" element={<Reviewer />} >
          <Route index path="timesheets-pending" element={<TimesheetPending />} />
        </Route>
      </Route>

      {/* Root Path Conditional Redirect */}


      {/* Catch-all route */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;


