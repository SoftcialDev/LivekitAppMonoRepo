import React, { memo, useCallback } from 'react';
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
  psoName?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  onSupervisorChange?: (psoEmail: string, newSupervisorEmail: string) => void;
  portalMinWidthPx?: number;
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
  className,
  psoName,
  supervisorEmail,
  supervisorName,
  onSupervisorChange,
  portalMinWidthPx
}) => {
  // ✅ Handlers estables
  const { createStableToggleHandler, createStableChatHandler } = useVideoCardOptimization();
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  const isLive = shouldStream;

  // ✅ Handler que maneja tanto START como STOP con razón
  const handleToggle = useCallback((email: string, reason?: string) => {
    if (reason) {
      // Si hay una razón, siempre es un STOP
      handleStop(email, reason);
    } else if (isLive) {
      // Si no hay razón y está transmitiendo, es un STOP
      handleStop(email);
    } else {
      // Si no hay razón y no está transmitiendo, es un START
      handlePlay(email);
    }
  }, [isLive, handleStop, handlePlay]);

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
      onToggle={createStableToggleHandler(email, isLive, handleToggle)}
      onPlay={handlePlay}
      onStop={handleStop}
      onChat={createStableChatHandler(email, handleChat)}
      className={className}
      statusMessage={statusMessage}
      psoName={psoName}
      supervisorEmail={supervisorEmail}
      supervisorName={supervisorName}
          onSupervisorChange={onSupervisorChange}
          portalMinWidthPx={portalMinWidthPx}
    />
  );
}, (prevProps, nextProps) => {
  // ✅ Comparador optimizado: solo re-renderizar si cambian props críticas
  const criticalProps = [
    'email', 'name', 'accessToken', 'roomName', 'livekitUrl', 
    'shouldStream', 'connecting', 'disableControls', 'statusMessage',
    'psoName', 'supervisorEmail', 'supervisorName'
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
