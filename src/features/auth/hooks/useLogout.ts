import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from './useAuth';


export const useLogout = () => {
  const { clearAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout request failed on backend:', err);
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
};
