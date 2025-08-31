import { useState, useCallback, useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UseToastReturn {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

/**
 * Custom hook for managing toast notifications
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [generateId]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'success' });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'error', duration: 8000 }); // Longer duration for errors
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'warning' });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ title, description, type: 'info' });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Hook for transaction-specific toast notifications
 */
export function useTransactionToast() {
  const toast = useToast();

  const transactionPending = useCallback((txHash: string) => {
    toast.info(
      'Transaction Pending',
      `Transaction ${txHash.slice(0, 10)}... is being processed`
    );
  }, [toast]);

  const transactionSuccess = useCallback((txHash: string, action?: string) => {
    toast.success(
      'Transaction Confirmed',
      `${action || 'Transaction'} completed successfully. Hash: ${txHash.slice(0, 10)}...`
    );
  }, [toast]);

  const transactionError = useCallback((error: any, action?: string) => {
    const errorMessage = error?.message || 'Unknown error occurred';
    toast.error(
      'Transaction Failed',
      `${action || 'Transaction'} failed: ${errorMessage}`
    );
  }, [toast]);

  return {
    ...toast,
    transactionPending,
    transactionSuccess,
    transactionError,
  };
}

/**
 * Global toast provider context (to be used with React Context)
 */
let globalToastInstance: UseToastReturn | null = null;

export function setGlobalToast(toastInstance: UseToastReturn) {
  globalToastInstance = toastInstance;
}

export function useGlobalToast(): UseToastReturn {
  if (!globalToastInstance) {
    throw new Error('Global toast not initialized. Make sure to call setGlobalToast in your app root.');
  }
  return globalToastInstance;
}
