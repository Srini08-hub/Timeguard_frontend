import { useContext } from 'react';
import { ConfirmContext } from '../components/ui/ConfirmDialog';
import type { ConfirmFunction } from '../components/ui/ConfirmDialog';
/**
 * Custom hook to consume confirmation dialog actions.
 */
export function useConfirm(): ConfirmFunction {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
