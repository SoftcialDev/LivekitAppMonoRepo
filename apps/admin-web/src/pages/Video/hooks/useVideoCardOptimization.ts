import { useCallback, useRef } from 'react';

/**
 * Hook para optimizar el rendimiento de VideoCards
 * Evita re-renders innecesarios manteniendo referencias estables
 */
export function useVideoCardOptimization() {
  const stableHandlersRef = useRef<Map<string, any>>(new Map());

  /**
   * Crea un handler estable para onToggle que no cambia entre renders
   * @param email - Email del PSO
   * @param isLive - Si está transmitiendo actualmente
   * @param onToggle - Función de toggle
   */
  const createStableToggleHandler = useCallback((
    email: string, 
    isLive: boolean, 
    onToggle: (email: string, reason?: string) => void
  ) => {
    const key = `${email}-toggle`;
    
    if (!stableHandlersRef.current.has(key)) {
      const handler = (emailParam: string, reason?: string) => {
        onToggle(emailParam, reason);
      };
      stableHandlersRef.current.set(key, handler);
    }
    
    return stableHandlersRef.current.get(key);
  }, []);

  /**
   * Crea un handler estable para onChat que no cambia entre renders
   * @param email - Email del PSO
   * @param onChat - Función de chat
   */
  const createStableChatHandler = useCallback((
    email: string,
    onChat: (email: string) => void
  ) => {
    const key = `chat-${email}`;
    
    if (!stableHandlersRef.current.has(key)) {
      stableHandlersRef.current.set(key, () => onChat(email));
    }
    
    return stableHandlersRef.current.get(key);
  }, []);

  /**
   * Limpia handlers obsoletos para evitar memory leaks
   */
  const cleanup = useCallback(() => {
    stableHandlersRef.current.clear();
  }, []);

  return {
    createStableToggleHandler,
    createStableChatHandler,
    cleanup
  };
}
