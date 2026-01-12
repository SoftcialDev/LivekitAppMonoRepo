/**
 * @fileoverview ToastContext - React context for toast notifications
 * @summary Provides toast notification functionality via context
 * @description React context for showing toast notifications throughout the application.
 * Provides a showToast method and manages toast state.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Toast } from './Toast';
import type { IToastContextType, IToastItem, IToastProviderProps } from './types';
import { ContextError } from '@/shared/errors';

/**
 * Toast context
 */
const ToastContext = createContext<IToastContextType | undefined>(undefined);

/**
 * ToastProvider component
 * 
 * Provides toast notification functionality to all children components.
 * Manages toast state and provides showToast method.
 * 
 * @param props.children - React children to wrap
 * @returns JSX element with toast context provider
 */
export const ToastProvider: React.FC<IToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<IToastItem[]>([]);

  /**
   * Removes a toast by ID from the toasts array
   * @param toastId - ID of the toast to remove
   */
  const removeToast = useCallback((toastId: number): void => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const showToast = useCallback<IToastContextType['showToast']>(
    (message, type = 'success', durationMs = 2000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Hook for accessing toast context
 * 
 * @returns Toast context value with showToast method
 * @throws {ContextError} if used outside ToastProvider
 * 
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * 
 * const handleSuccess = () => {
 *   showToast('Operation completed successfully!', 'success');
 * };
 * ```
 */
export const useToast = (): IToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new ContextError(
      'useToast must be used within a <ToastProvider>. ' +
        'Make sure to wrap your component tree with ToastProvider.'
    );
  }
  return context;
};

