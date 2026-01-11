/**
 * @fileoverview RefreshButton - Button component for refreshing PSO browser
 * @summary Sends refresh command to PSO's browser with cooldown protection
 * @description Button that sends a refresh command to reload the PSO's browser.
 * Shows a toast notification and disables the button for 10 seconds after clicking
 * to prevent spam.
 */

import React, { useState, useCallback, useRef } from 'react';
import { RefreshIcon } from '@/ui-kit/icons';
import { CameraCommandClient } from '../api/cameraCommandClient';
import { useToast } from '@/ui-kit/feedback';
import { logError, logDebug } from '@/shared/utils/logger';
import type { IRefreshButtonProps } from './types/refreshButtonTypes';
import { REFRESH_BUTTON_COOLDOWN_MS } from './constants/refreshButtonConstants';

/**
 * RefreshButton component
 * 
 * Button that sends a refresh command to reload the PSO's browser.
 * Shows toast notifications and implements cooldown to prevent spam.
 * 
 * @param props - Component props
 * @returns React element rendering the refresh button
 */
export const RefreshButton: React.FC<IRefreshButtonProps> = ({ 
  email, 
  className = '' 
}) => {
  const cameraCommandClientRef = useRef(new CameraCommandClient());
  const { showToast } = useToast();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClick = useCallback(async () => {
    if (!email || isDisabled) return;
    
    setIsDisabled(true);
    
    try {
      logDebug('[RefreshButton] Sending refresh command', { email });
      await cameraCommandClientRef.current.refresh(email);
      showToast('Refresh command sent successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send refresh command';
      logError('[RefreshButton] Failed to send refresh command', { error, email });
      showToast(errorMessage, 'error');
    } finally {
      setTimeout(() => {
        setIsDisabled(false);
      }, REFRESH_BUTTON_COOLDOWN_MS);
    }
  }, [email, isDisabled, showToast]);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 hover:opacity-80 transition-opacity bg-[#BBA6CF]! disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isDisabled ? 'Refresh button is on cooldown' : 'Refresh browser'}
    >
      <RefreshIcon size={20} />
    </button>
  );
};

