/**
 * @fileoverview useCameraFailureNotifications hook
 * @summary Hook for listening to camera failure WebSocket notifications
 * @description Listens to camera failure events and displays toast notifications
 */

import { useEffect } from 'react';
import { useToast } from '@/ui-kit/feedback';
import { logDebug } from '@/shared/utils/logger';

/**
 * Hook that listens to camera failure WebSocket notifications and displays toast messages
 * 
 * This hook sets up a listener for custom 'cameraFailure' events dispatched by
 * the CameraFailureMessageHandler when it processes WebSocket messages.
 * 
 * Should be used at the app level (e.g., in AppProviders or main App component)
 * to ensure toast notifications are shown for all camera failures.
 * 
 * @example
 * ```tsx
 * function App() {
 *   useCameraFailureNotifications();
 *   return <AppContent />;
 * }
 * ```
 */
export function useCameraFailureNotifications(): void {
  const { showToast } = useToast();

  useEffect(() => {
    const handleCameraFailure = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        psoEmail: string;
        psoName: string;
        errorMessage: string;
      }>;

      const { psoEmail, psoName, errorMessage } = customEvent.detail;

      logDebug('[useCameraFailureNotifications] Camera failure received', {
        psoEmail,
        psoName,
        errorMessage,
      });

      // Display toast notification with user-friendly error message
      showToast(
        `Error al iniciar cámara para ${psoName}: ${errorMessage}`,
        'error'
      );
    };

    // Listen for custom camera failure events
    window.addEventListener('cameraFailure', handleCameraFailure);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('cameraFailure', handleCameraFailure);
    };
  }, [showToast]);
}

