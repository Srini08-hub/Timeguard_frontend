import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from './useAuth';
import type { LoginCredentials } from '../types';

export const useLogin = () => {
  const { setAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response) {
        const { user_id,name,email, role } = response;
        setAuth(user_id,name,email,role);
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'OpsAdmin') {
          navigate('/ops-admin', { replace: true });
        } else if (role === 'reviewer') {
          navigate('/reviewer', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        throw new Error('User information was not returned in the login response.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Login failed';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
