import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { UserRole } from '../features/auth/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { userId, role } = useAuth();

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect authorized users trying to access pages from other roles back to their dashboard
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'OpsAdmin') {
      return <Navigate to="/ops-admin" replace />;
    } else if (role === 'reviewer') {
      return <Navigate to="/reviewer" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
