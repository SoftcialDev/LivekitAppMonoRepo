import { useState, useEffect, useCallback } from 'react';
import { nowCRMs, parseIsoAsCRWallClock } from '@/shared/utils/time';

export interface TimerInfo {
  type: 'LUNCH_BREAK' | 'SHORT_BREAK' | 'QUICK_BREAK' | 'EMERGENCY';
  duration: number; // in minutes
  remainingTime: number; // in seconds
  isExpired: boolean;
  isNegative: boolean;
  displayTime: string; // formatted time (MM:SS or -MM:SS)
  color: 'green' | 'yellow' | 'red';
}

/**
 * Hook para manejar timers sincronizados basados en StreamingStatusBatch
 * Calcula el tiempo restante basado en stoppedAt + duration - currentTime
 */
export function useSynchronizedTimer(
  stopReason: string | null | undefined,
  stoppedAt: string | null | undefined,
  refreshInterval: number = 1000 // 1 second
): TimerInfo | null {
  const [timerInfo, setTimerInfo] = useState<TimerInfo | null>(null);

  const calculateTimerInfo = useCallback((): TimerInfo | null => {
    if (!stopReason || !stoppedAt) {
      return null;
    }

    
    // Determinar tipo de timer y duración
    let type: 'LUNCH_BREAK' | 'SHORT_BREAK' | 'QUICK_BREAK' | 'EMERGENCY';
    let duration: number; // in minutes
    
    switch (stopReason) {
      case 'LUNCH_BREAK':
        type = 'LUNCH_BREAK';
        duration = 30; // 30 minutes
        break;
      case 'SHORT_BREAK':
        type = 'SHORT_BREAK';
        duration = 15; // 15 minutes
        break;
      case 'QUICK_BREAK':
        type = 'QUICK_BREAK';
        duration = 5; // 5 minutes
        break;
      case 'EMERGENCY':
        type = 'EMERGENCY';
        duration = 0; // No limit for emergency
        break;
      default:
        return null;
    }

    // Calcular tiempo transcurrido en segundos usando Central America Time
    const nowMs = nowCRMs(); // Current time in Central America
    const stopTimeMs = parseIsoAsCRWallClock(stoppedAt).valueOf(); // Parse stoppedAt as CR time
    const elapsedSeconds = Math.floor((nowMs - stopTimeMs) / 1000);
    
    
    let remainingTime: number;
    let isExpired: boolean;
    let isNegative: boolean;
    
    if (type === 'EMERGENCY') {
      // Para emergency, mostrar tiempo transcurrido (hacia arriba)
      remainingTime = elapsedSeconds;
      isExpired = false;
      isNegative = false;
    } else {
      // Para lunch/break, mostrar tiempo restante (hacia abajo)
      const totalDurationSeconds = duration * 60;
      remainingTime = totalDurationSeconds - elapsedSeconds;
      isExpired = remainingTime <= 0;
      isNegative = remainingTime < 0;
    }

    // Formatear tiempo para display
    const absTime = Math.abs(remainingTime);
    const minutes = Math.floor(absTime / 60);
    const seconds = absTime % 60;
    const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Determinar color
    let color: 'green' | 'yellow' | 'red';
    if (type === 'EMERGENCY') {
      color = 'green'; // Siempre verde para emergency
    } else if (isNegative) {
      color = 'red'; // Rojo cuando es negativo
    } else if (remainingTime <= 60) { // Último minuto
      color = 'red'; // Rojo en el último minuto
    } else if (remainingTime <= 300) { // Últimos 5 minutos
      color = 'yellow'; // Amarillo en los últimos 5 minutos
    } else {
      color = 'green'; // Verde cuando hay tiempo suficiente
    }

    return {
      type,
      duration,
      remainingTime,
      isExpired,
      isNegative,
      displayTime: isNegative ? `+${displayTime}` : displayTime,
      color
    };
  }, [stopReason, stoppedAt]);

  // Actualizar timer cada segundo
  useEffect(() => {
    if (!stopReason || !stoppedAt) {
      setTimerInfo(null);
      return;
    }

    // Calcular inmediatamente
    setTimerInfo(calculateTimerInfo());

    // Configurar intervalo para actualizaciones
    const interval = setInterval(() => {
      setTimerInfo(calculateTimerInfo());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [stopReason, stoppedAt, calculateTimerInfo, refreshInterval]);

  return timerInfo;
}

/**
 * Hook para obtener timer info de múltiples usuarios
 * Útil para componentes que muestran múltiples timers
 */
export function useMultipleSynchronizedTimers(
  sessions: Array<{ email: string; lastSession: { stopReason: string | null; stoppedAt: string | null } | null }>
): Record<string, TimerInfo | null> {
  const [timers, setTimers] = useState<Record<string, TimerInfo | null>>({});

  useEffect(() => {
    const newTimers: Record<string, TimerInfo | null> = {};
    
    sessions.forEach(({ email, lastSession }) => {
      if (lastSession) {
        const timer = useSynchronizedTimer(lastSession.stopReason, lastSession.stoppedAt);
        newTimers[email] = timer;
      } else {
        newTimers[email] = null;
      }
    });

    setTimers(newTimers);
  }, [sessions]);

  return timers;
}
