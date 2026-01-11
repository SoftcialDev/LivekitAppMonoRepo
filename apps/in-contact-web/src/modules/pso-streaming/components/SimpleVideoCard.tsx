/**
 * @fileoverview SimpleVideoCard component
 * @summary Optimized wrapper for VideoCard that avoids infinite re-render loops
 * @description Simplified VideoCard wrapper that uses the full-featured VideoCard component
 * with stable handlers. Receives name as prop instead of looking it up dynamically.
 * Uses stable handlers to prevent unnecessary re-renders.
 */

import React, { memo, useCallback } from 'react';
import { useVideoActions } from '../hooks/actions';
import VideoCard from './VideoCard';
import type { ISimpleVideoCardProps } from './types/videoCardTypes';

/**
 * Simplified VideoCard wrapper that uses the full-featured VideoCard component
 * Receives the name as prop instead of looking it up dynamically
 * 
 * Uses stable handlers via useVideoActions to prevent unnecessary re-renders
 */
const SimpleVideoCard: React.FC<ISimpleVideoCardProps> = memo(({
  email,
  name,
  accessToken,
  roomName,
  livekitUrl,
  shouldStream,
  connecting,
  disableControls,
  statusMessage,
  className,
  psoName,
  supervisorEmail,
  supervisorName,
  onSupervisorChange,
  portalMinWidthPx,
  stopReason,
  stoppedAt
}) => {
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  /**
   * Handler that manages both START and STOP with optional reason
   */
  const handleToggle = useCallback((email: string, reason?: string | unknown) => {
    if (reason) {
      // If there's a reason, it's always a STOP
      // Convert enum to string if needed
      const reasonStr = typeof reason === 'string' ? reason : String(reason);
      handleStop(email, reasonStr);
    } else if (shouldStream) {
      // If no reason and currently streaming, it's a STOP
      handleStop(email);
    } else {
      // If no reason and not streaming, it's a START
      handlePlay(email);
    }
  }, [shouldStream, handleStop, handlePlay]);

  const handleChatClick = useCallback((email: string) => {
    handleChat(email);
  }, [handleChat]);

  return (
    <VideoCard
      name={name}
      email={email}
      onChat={handleChatClick}
      showHeader={true}
      stopReason={stopReason || undefined}
      stoppedAt={stoppedAt || undefined}
      className={className}
      accessToken={accessToken}
      roomName={roomName}
      livekitUrl={livekitUrl}
      disableControls={disableControls}
      shouldStream={shouldStream}
      connecting={connecting}
      onToggle={handleToggle}
      statusMessage={statusMessage}
      psoName={psoName}
      supervisorEmail={supervisorEmail}
      supervisorName={supervisorName}
      onSupervisorChange={onSupervisorChange}
      portalMinWidthPx={portalMinWidthPx}
    />
  );
}, (prevProps, nextProps) => {
  // Optimized comparator: only re-render if critical props change
  const criticalProps: Array<keyof ISimpleVideoCardProps> = [
    'email', 'name', 'accessToken', 'roomName', 'livekitUrl', 
    'shouldStream', 'connecting', 'disableControls', 'statusMessage',
    'psoName', 'supervisorEmail', 'supervisorName', 'stopReason', 'stoppedAt'
  ];
  
  for (const prop of criticalProps) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false; // Props changed, should re-render
    }
  }
  
  return true; // Props are the same, skip re-render
});

SimpleVideoCard.displayName = 'SimpleVideoCard';

export default SimpleVideoCard;

