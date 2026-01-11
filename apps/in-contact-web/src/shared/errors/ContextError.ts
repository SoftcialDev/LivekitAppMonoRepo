/**
 * @fileoverview ContextError - Error for React context misuse
 * @summary Error thrown when a hook is used outside its required provider
 * @description Domain-specific error for React context misuse scenarios.
 * Used when hooks that depend on context are called outside their provider.
 */

import { AppError } from './AppError';

/**
 * Error thrown when a React context hook is used outside its provider
 * 
 * This error indicates that a component is trying to use a context hook
 * (e.g., useToast, useAuth, useHeader) without being wrapped in the
 * corresponding provider component.
 * 
 * @example
 * ```tsx
 * // WRONG: Using hook outside provider
 * function MyComponent() {
 *   const { showToast } = useToast(); // Throws ContextError
 * }
 * 
 * // CORRECT: Using hook inside provider
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <MyComponent />
 *     </ToastProvider>
 *   );
 * }
 * ```
 */
export class ContextError extends AppError {
  /**
   * Creates a new ContextError
   * 
   * @param message - Error message describing which hook/provider is missing
   * @param cause - Optional underlying error that caused this error
   */
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

