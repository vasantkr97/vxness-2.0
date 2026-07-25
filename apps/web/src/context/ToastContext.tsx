import React, { useState, type ReactNode, useCallback } from 'react';
import { ToastContext, type ToastState, type ToastType } from './toast';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
      setTimeout(() => setToast(null), 300);
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
};
