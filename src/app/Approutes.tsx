import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoutes';
import { LoginPage } from '../features/auth/pages/LoginPage';
import Admin from '../features/Dashboard/pages/Admin';
import OperationManger from '../features/Dashboard/pages/OperationManger';
import Reviewer from '../features/Dashboard/pages/Reviewer';
import { CreateUserForm } from '../features/User/components/CreateUserForm';
const AppRoutes: React.FC = () => {
   const { userId, role } = useAuth();
   const getDefaultRoute = () => {
    if (!userId) return '/login'
    if (role === 'admin') return '/admin/user'
    if (role === 'operation_manager') return '/operation-manager'
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
             <Route index path="create-user" element={<CreateUserForm />} />
          </Route>

      </Route>

      <Route element={<ProtectedRoute allowedRoles={['operation_manager']} />}>
        <Route path="/operation-manager" element={<OperationManger />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['reviewer']} />}>
        <Route path="/reviewer" element={<Reviewer />} />
      </Route>

      {/* Root Path Conditional Redirect */}
     

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;