import React, { createContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration?: number; // duration in ms
}

export interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const success = useCallback((message: string, title?: string, duration = 4000) => {
    addToast({ message, title, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((message: string, title?: string, duration = 4000) => {
    addToast({ message, title, type: 'error', duration });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string, duration = 4000) => {
    addToast({ message, title, type: 'warning', duration });
  }, [addToast]);

  const info = useCallback((message: string, title?: string, duration = 4000) => {
    addToast({ message, title, type: 'info', duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast viewport */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
        aria-live="assertive"
        aria-instant="true"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const { title, message, type, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  };

  const bgStyles = {
    success: 'bg-white border-green-100 dark:bg-gray-900 dark:border-green-950/45',
    warning: 'bg-white border-amber-100 dark:bg-gray-900 dark:border-amber-950/45',
    error: 'bg-white border-red-100 dark:bg-gray-900 dark:border-red-950/45',
    info: 'bg-white border-blue-100 dark:bg-gray-900 dark:border-blue-950/45',
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-full max-w-sm rounded-xl border p-4 shadow-lg animate-in slide-in-from-right duration-300 dark:shadow-black/40 ${bgStyles[type]}`}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="shrink-0">{iconMap[type]}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
              {title}
            </h3>
          )}
          <p className="text-xs text-gray-550 dark:text-gray-400 leading-relaxed font-normal">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 text-gray-400 hover:text-gray-500 rounded-lg p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
