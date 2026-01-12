/**
 * @fileoverview VideoCard - React component for displaying LiveKit video/audio streams
 * @summary Displays a video/audio stream for one remote user with controls
 * @description This component renders a LiveKit video/audio stream card with controls for
 * play/stop, chat, mute/unmute, snapshot capture, talkback (two-way audio), and recording.
 * All business logic is encapsulated in the useVideoCardLogic hook.
 */

import React, { memo } from 'react';
import { VideoCardHeader, VideoCardDisplay, VideoCardControls, VideoCardSnapshotModal } from './VideoCard/components';
import { useVideoCardLogic } from './VideoCard/hooks';
import type { IVideoCardProps } from './types/videoCardTypes';

/**
 * VideoCard component
 * 
 * Displays a video/audio stream for one remote user with full controls:
 * - Play/Stop with stop reason selection
 * - Chat
 * - Talk (two-way audio) with permission checks
 * - Snapshot capture with modal
 * - Recording
 * - Supervisor selector
 * - Refresh button
 * - Timer display for breaks
 * 
 * @param props - Component props
 * @returns React element rendering the video card
 */
const VideoCard: React.FC<IVideoCardProps> = memo((props) => {
  const { className = '' } = props;
  const { headerProps, displayProps, controlsProps, modalProps } = useVideoCardLogic(props);

  return (
    <>
      <div className={`flex flex-col bg-(--color-primary-dark) rounded-xl overflow-visible ${className}`}>
        <VideoCardHeader {...headerProps} />
        <VideoCardDisplay {...displayProps} />
        <VideoCardControls {...controlsProps} />
      </div>
      <VideoCardSnapshotModal {...modalProps} />
    </>
  );
}, (prevProps, nextProps) => {
  const criticalProps: Array<keyof IVideoCardProps> = ['email', 'accessToken', 'roomName', 'livekitUrl', 'shouldStream', 'connecting', 'statusMessage'];
  
  for (const prop of criticalProps) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false; // Props changed, should re-render
    }
  }
  
  return true; // Props are the same, skip re-render
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
