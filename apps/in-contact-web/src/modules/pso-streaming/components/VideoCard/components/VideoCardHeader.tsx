/**
 * @fileoverview VideoCardHeader - Header component for VideoCard
 * @summary Displays header with supervisor selector or name
 * @description Component that renders the header of the video card, either with
 * a supervisor selector dropdown or a simple name display.
 */

import React from 'react';
import SupervisorSelector from '../../SupervisorSelector';
import { DesktopIcon, BrowserIcon } from '@/ui-kit/icons';
import { Platform } from '@/shared/enums/Platform';
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
  psoPlatform,
  totalItemCount,
}) => {
  if (!showHeader) {
    return null;
  }

  const isSmallGrid = totalItemCount !== undefined && totalItemCount <= 3;
  const textSizeClass = isSmallGrid ? 'text-lg font-semibold' : 'text-sm';
  const supervisorTextSizeClass = isSmallGrid ? 'text-base' : 'text-xs';

  return (
    <div className="flex items-center px-2 py-1 relative z-50 gap-2 min-w-0">
      {psoName && onSupervisorChange ? (
        <SupervisorSelector
          psoName={psoName}
          currentSupervisorEmail={supervisorEmail || ''}
          currentSupervisorName={supervisorName || ''}
          psoEmail={email}
          onSupervisorChange={onSupervisorChange}
          disabled={disableControls}
          className={`w-full min-w-0 ${textSizeClass}`}
          portalMinWidthPx={portalMinWidthPx}
          textSizeClass={supervisorTextSizeClass}
        />
      ) : (
        <div className={`text-white truncate flex-1 min-w-0 ${textSizeClass}`}>{name}</div>
      )}
      {psoPlatform && (
        <div 
          className="shrink-0" 
          title={psoPlatform === Platform.Electron ? 'Electron App' : 'Browser'}
        >
          {psoPlatform === Platform.Electron ? (
            <DesktopIcon className="w-4 h-4 text-(--color-secondary)" />
          ) : (
            <BrowserIcon className="w-4 h-4 text-(--color-secondary)" />
          )}
        </div>
      )}
    </div>
  );
};

