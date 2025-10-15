import { useState, useCallback } from 'react';

interface VideoCardState {
  shouldStream: boolean;
  connecting: boolean;
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
}

type VideoCardStates = Record<string, VideoCardState>;

/**
 * Hook para manejar el estado individual de cada VideoCard
 * Evita re-renders innecesarios al actualizar solo la tarjeta afectada
 */
export function useVideoCardState() {
  const [cardStates, setCardStates] = useState<VideoCardStates>({});

  // Actualizar estado de una tarjeta específica
  const updateCardState = useCallback((email: string, updates: Partial<VideoCardState>) => {
    setCardStates(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        ...updates
      }
    }));
  }, []);

  // Obtener estado de una tarjeta específica
  const getCardState = useCallback((email: string): VideoCardState => {
    return cardStates[email] || {
      shouldStream: false,
      connecting: false
    };
  }, [cardStates]);

  // Establecer estado de conexión para una tarjeta
  const setConnecting = useCallback((email: string, connecting: boolean) => {
    updateCardState(email, { connecting });
  }, [updateCardState]);

  // Establecer streaming para una tarjeta
  const setStreaming = useCallback((email: string, shouldStream: boolean) => {
    updateCardState(email, { shouldStream });
  }, [updateCardState]);

  // Establecer credenciales para una tarjeta
  const setCredentials = useCallback((email: string, credentials: {
    accessToken?: string;
    roomName?: string;
    livekitUrl?: string;
  }) => {
    updateCardState(email, credentials);
  }, [updateCardState]);

  // Limpiar estado de una tarjeta
  const clearCardState = useCallback((email: string) => {
    setCardStates(prev => {
      const newStates = { ...prev };
      delete newStates[email];
      return newStates;
    });
  }, []);

  return {
    cardStates,
    updateCardState,
    getCardState,
    setConnecting,
    setStreaming,
    setCredentials,
    clearCardState
  };
}
