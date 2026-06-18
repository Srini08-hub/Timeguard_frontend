import { useContext } from 'react';
import { ToastContext } from '../components/ui/Toast';
import type { ToastContextType } from '../components/ui/Toast';

/**
 * Custom hook to consume Toast notifications context.
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
