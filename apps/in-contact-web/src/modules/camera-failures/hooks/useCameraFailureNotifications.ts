/**
 * @fileoverview useCameraFailureNotifications hook
 * @summary Hook for listening to camera failure WebSocket notifications
 * @description Listens to camera failure events and stores them for display in video cards
 */

import { useEffect } from 'react';
import { logDebug } from '@/shared/utils/logger';
import { useCameraFailureStore } from '@/modules/pso-streaming/stores/camera-failure-store';

/**
 * Hook that listens to camera failure WebSocket notifications and stores them
 * 
 * This hook sets up a listener for custom 'cameraFailure' events dispatched by
 * the CameraFailureMessageHandler when it processes WebSocket messages.
 * 
 * Errors are stored in the camera failure store so they can be displayed
 * in the video card while connecting.
 * 
 * Should be used at the app level (e.g., in AppProviders or main App component)
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
  const setError = useCameraFailureStore((state) => state.setError);

  useEffect(() => {
    const handleCameraFailure = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        psoEmail: string;
        psoName: string;
        errorMessage: string;
      }>;

      const { psoEmail, errorMessage } = customEvent.detail;

      logDebug('[useCameraFailureNotifications] Camera failure received', {
        psoEmail,
        errorMessage,
      });

      // Store error message for display in video card
      setError(psoEmail, errorMessage);
    };

    // Listen for custom camera failure events
    window.addEventListener('cameraFailure', handleCameraFailure);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('cameraFailure', handleCameraFailure);
    };
  }, [setError]);
}

