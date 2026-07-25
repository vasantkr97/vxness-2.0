import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  toast: ToastState | null;
  hideToast: () => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
