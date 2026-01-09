import React, { useState, useCallback } from 'react';
import { RefreshIcon } from '@/shared/ui/icons/RefreshIcon';
import { CameraCommandClient } from '@/shared/api/camaraCommandClient';
import { useToast } from '@/shared/ui/ToastContext';

/**
 * Time in milliseconds to disable the refresh button after clicking
 */
const REFRESH_BUTTON_COOLDOWN_MS = 10 * 1000; // 10 seconds

interface RefreshButtonProps {
  email: string;
  className?: string;
}

/**
 * Botón de refresh que envía un comando para recargar el navegador del PSO.
 * Muestra un toast y se bloquea por 10 segundos después de hacer clic.
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  email, 
  className = '' 
}) => {
  const cameraCommandClient = React.useRef(new CameraCommandClient()).current;
  const { showToast } = useToast();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClick = useCallback(async () => {
    if (!email || isDisabled) return;
    
    // Disable button immediately
    setIsDisabled(true);
    
    try {
      await cameraCommandClient.refresh(email);
      showToast('Refresh command sent successfully', 'success');
    } catch (error) {
      console.error('[RefreshButton] Failed to send refresh command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send refresh command';
      showToast(errorMessage, 'error');
    }
    
    // Re-enable button after cooldown period (regardless of success or error)
    setTimeout(() => {
      setIsDisabled(false);
    }, REFRESH_BUTTON_COOLDOWN_MS);
  }, [email, isDisabled, cameraCommandClient, showToast]);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 hover:opacity-80 transition-opacity !bg-[#BBA6CF] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isDisabled ? 'Refresh button is on cooldown' : 'Refresh browser'}
    >
      <RefreshIcon size={20} />
    </button>
  );
};

export default RefreshButton;

