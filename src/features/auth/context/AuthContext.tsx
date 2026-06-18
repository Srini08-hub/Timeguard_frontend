import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import type { UserRole } from '../types';

export interface AuthContextType {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  setAuth: (userId: string, name: string, email: string, role: UserRole) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserId(user.user_id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
      } catch {
        setUserId(null);
        setName(null);
        setEmail(null);
        setRole(null);
      } finally {
        setAuthChecked(true);
      }
    };

    fetchCurrentUser();
  }, []);

  const setAuth = (newUserId: string, newName: string, newEmail: string, newRole: UserRole) => {
    setUserId(newUserId);
    setName(newName);
    setEmail(newEmail);
    setRole(newRole);
    // Persist in localStorage to survive page refreshes
  };

  const clearAuth = () => {
    setUserId(null);
    setName(null);
    setEmail(null);
    setRole(null);
  };

  if (!authChecked) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ userId, name, email, role, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
