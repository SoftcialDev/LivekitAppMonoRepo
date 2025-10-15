import React, { memo } from 'react';
import { usePresenceUser } from '@/shared/presence/usePresenceSelectors';
import VideoCard from './VideoCard';
import { useVideoCardOptimization } from '../hooks/useVideoCardOptimization';
import { useVideoActions } from '../hooks/UseVideoAction';

interface OptimizedVideoCardProps {
  email: string;
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  shouldStream: boolean;
  connecting: boolean;
  disableControls: boolean;
  className?: string;
}

/**
 * VideoCard optimizado que solo se actualiza cuando cambia el usuario específico
 * Evita re-renders innecesarios cuando otros usuarios se conectan/desconectan
 */
const OptimizedVideoCard: React.FC<OptimizedVideoCardProps> = memo(({
  email,
  accessToken,
  roomName,
  livekitUrl,
  shouldStream,
  connecting,
  disableControls,
  className
}) => {
  // ✅ Solo se actualiza cuando cambia este usuario específico
  const user = usePresenceUser(email);
  
  // ✅ Handlers estables
  const { createStableToggleHandler, createStableChatHandler } = useVideoCardOptimization();
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  if (!user) {
    return null; // Usuario no encontrado
  }

  const name = `${user.fullName} — Supervisor: ${user.supervisorEmail || 'Supervisor Assigned'}`;
  const isLive = shouldStream;

  return (
    <VideoCard
      name={name}
      email={email}
      accessToken={accessToken}
      roomName={roomName}
      livekitUrl={livekitUrl}
      shouldStream={shouldStream}
      connecting={connecting}
      disableControls={disableControls}
      onToggle={createStableToggleHandler(email, isLive, isLive ? handleStop : handlePlay)}
      onPlay={handlePlay}
      onStop={handleStop}
      onChat={createStableChatHandler(email, handleChat)}
      className={className}
    />
  );
}, (prevProps, nextProps) => {
  // ✅ Comparador optimizado: solo re-renderizar si cambian props críticas
  const criticalProps = [
    'email', 'accessToken', 'roomName', 'livekitUrl', 
    'shouldStream', 'connecting', 'disableControls'
  ];
  
  for (const prop of criticalProps) {
    if (prevProps[prop as keyof typeof prevProps] !== nextProps[prop as keyof typeof nextProps]) {
      return false; // Props changed, should re-render
    }
  }
  
  return true; // Props are the same, skip re-render
});

OptimizedVideoCard.displayName = 'OptimizedVideoCard';

export default OptimizedVideoCard;
