import React, { createContext, useState, useCallback, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'danger';
}

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFunction | null>(null);

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
}

const defaultOptions: ConfirmOptions = {
  title: 'Are you sure?',
  message: 'This action cannot be undone.',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'warning',
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: defaultOptions,
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      isOpen: true,
      options: { ...defaultOptions, ...options },
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  // Set colors based on dialog variant
  const getVariantStyles = () => {
    switch (state.options.variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 dark:bg-red-950/35',
          iconColor: 'text-red-650 dark:text-red-400',
          btnVariant: 'danger' as const,
        };
      case 'info':
        return {
          iconBg: 'bg-blue-50 dark:bg-blue-950/35',
          iconColor: 'text-blue-650 dark:text-blue-400',
          btnVariant: 'primary' as const,
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-950/35',
          iconColor: 'text-amber-650 dark:text-amber-400',
          btnVariant: 'primary' as const, // primary will act as confirm
        };
    }
  };

  const { iconBg, iconColor, btnVariant } = getVariantStyles();

  const modalFooter = (
    <>
      <Button variant="outline" onClick={handleCancel}>
        {state.options.cancelText}
      </Button>
      <Button variant={btnVariant} onClick={handleConfirm}>
        {state.options.confirmText}
      </Button>
    </>
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={state.isOpen}
        onClose={handleCancel}
        title={state.options.title}
        size="sm"
        footer={modalFooter}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${iconBg} ${iconColor}`}>
            {state.options.variant === 'danger' && (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {state.options.variant === 'warning' && (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {state.options.variant === 'info' && (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-550 dark:text-gray-400 mt-1.5">
              {state.options.message}
            </p>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};
