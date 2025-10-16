import React, { memo } from 'react';
import VideoCard from './VideoCard';
import { useVideoCardOptimization } from '../hooks/useVideoCardOptimization';
import { useVideoActions } from '../hooks/UseVideoAction';

interface SimpleVideoCardProps {
  email: string;
  name: string;
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  shouldStream: boolean;
  connecting: boolean;
  disableControls: boolean;
  className?: string;
  statusMessage?: string;
}

/**
 * VideoCard simplificado que evita bucles infinitos
 * Recibe el name como prop en lugar de buscarlo dinámicamente
 */
const SimpleVideoCard: React.FC<SimpleVideoCardProps> = memo(({
  email,
  name,
  accessToken,
  roomName,
  livekitUrl,
  shouldStream,
  connecting,
  disableControls,
  statusMessage,
  className
}) => {
  // ✅ Handlers estables
  const { createStableToggleHandler, createStableChatHandler } = useVideoCardOptimization();
  const { handlePlay, handleStop, handleChat } = useVideoActions();

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
      statusMessage={statusMessage}
    />
  );
}, (prevProps, nextProps) => {
  // ✅ Comparador optimizado: solo re-renderizar si cambian props críticas
  const criticalProps = [
    'email', 'name', 'accessToken', 'roomName', 'livekitUrl', 
    'shouldStream', 'connecting', 'disableControls', 'statusMessage'
  ];
  
  for (const prop of criticalProps) {
    if (prevProps[prop as keyof typeof prevProps] !== nextProps[prop as keyof typeof nextProps]) {
      return false; // Props changed, should re-render
    }
  }
  
  return true; // Props are the same, skip re-render
});

SimpleVideoCard.displayName = 'SimpleVideoCard';

export default SimpleVideoCard;
