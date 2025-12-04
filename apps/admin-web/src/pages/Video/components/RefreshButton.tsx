import React from 'react';
import { RefreshIcon } from '@/shared/ui/icons/RefreshIcon';
import { CameraCommandClient } from '@/shared/api/camaraCommandClient';

interface RefreshButtonProps {
  email: string;
  className?: string;
}

/**
 * Botón de refresh que envía un comando para recargar el navegador del PSO.
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  email, 
  className = '' 
}) => {
  const cameraCommandClient = React.useRef(new CameraCommandClient()).current;

  const handleClick = async () => {
    if (!email) return;
    try {
      await cameraCommandClient.refresh(email);
    } catch (error) {
      console.error('[RefreshButton] Failed to send refresh command:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 hover:opacity-80 transition-opacity !bg-[#BBA6CF] ${className}`}
      title="Refresh browser"
    >
      <RefreshIcon size={20} />
    </button>
  );
};

export default RefreshButton;

