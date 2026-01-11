/**
 * @fileoverview VideoCardHeader - Header component for VideoCard
 * @summary Displays header with supervisor selector or name
 * @description Component that renders the header of the video card, either with
 * a supervisor selector dropdown or a simple name display.
 */

import React from 'react';
import SupervisorSelector from '../../SupervisorSelector';
import type { IVideoCardHeaderProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardHeader component
 * 
 * Renders the header section of the video card, showing either:
 * - SupervisorSelector if psoName and onSupervisorChange are provided
 * - Simple name text otherwise
 * 
 * @param props - Component props
 * @returns React element rendering the header or null if showHeader is false
 */
export const VideoCardHeader: React.FC<IVideoCardHeaderProps> = ({
  showHeader,
  psoName,
  name,
  supervisorEmail,
  supervisorName,
  onSupervisorChange,
  email,
  disableControls,
  portalMinWidthPx,
}) => {
  if (!showHeader) {
    return null;
  }

  return (
    <div className="flex items-center px-2 py-1 relative z-50">
      {psoName && onSupervisorChange ? (
        <SupervisorSelector
          psoName={psoName}
          currentSupervisorEmail={supervisorEmail || ''}
          currentSupervisorName={supervisorName || ''}
          psoEmail={email}
          onSupervisorChange={onSupervisorChange}
          disabled={disableControls}
          className="w-full"
          portalMinWidthPx={portalMinWidthPx}
        />
      ) : (
        <div className="text-white truncate">{name}</div>
      )}
    </div>
  );
};

