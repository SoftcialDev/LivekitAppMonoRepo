/**
 * @fileoverview StartStopButton component
 * @summary Button component for starting/stopping video streams
 * @description Reusable button for play/stop actions in video cards
 */

import React from 'react';
import type { IStartStopButtonProps } from '../types/buttonTypes';

/**
 * Button component for starting/stopping video streams
 */
export const StartStopButton: React.FC<IStartStopButtonProps> = ({
  isLive,
  onClick,
  disabled = false,
  loading = false,
  label,
  className = '',
}) => {
  const displayLabel = label || (isLive ? 'Stop' : 'Start');
  const title = isLive ? 'Stop stream' : 'Start stream';

  return (
    <div className={`flex-1 relative ${className}`}>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full py-2 bg-white text-(--color-primary-dark) rounded-xl disabled:opacity-50"
        title={title}
      >
        {loading ? '...' : displayLabel}
      </button>
    </div>
  );
};

