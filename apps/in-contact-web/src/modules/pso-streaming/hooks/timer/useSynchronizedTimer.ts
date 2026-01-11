/**
 * @fileoverview useSynchronizedTimer hook
 * @summary Hook for managing synchronized timers based on streaming status
 * @description Calculates remaining time based on stoppedAt + duration - currentTime
 */

import { useState, useEffect, useCallback } from 'react';
import { nowCRMs, parseIsoAsCRWallClock } from '@/shared/utils/time';
import { StreamingStopReason } from '../../enums';
import { TimerType, TimerColor } from '../../enums';
import { TIMER_DURATIONS, STOP_REASON_TO_TIMER_TYPE, TIMER_COLOR_THRESHOLDS } from '../../constants';
import type { TimerInfo } from '../../types';

/**
 * Hook for managing synchronized timers based on StreamingStatusBatch
 * Calculates remaining time based on stoppedAt + duration - currentTime
 * 
 * @param stopReason - Stop reason from streaming status
 * @param stoppedAt - ISO timestamp when stream was stopped
 * @param refreshInterval - Interval in ms for timer updates (default: 1000ms = 1 second)
 * @returns TimerInfo object with timer state, or null if no valid timer
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

    const timerType = STOP_REASON_TO_TIMER_TYPE[stopReason as StreamingStopReason];
    if (!timerType) {
      return null;
    }

    const duration = TIMER_DURATIONS[timerType];
    const nowMs = nowCRMs();
    const stopTimeMs = parseIsoAsCRWallClock(stoppedAt).valueOf();
    const elapsedSeconds = Math.floor((nowMs - stopTimeMs) / 1000);
    
    let remainingTime: number;
    let isExpired: boolean;
    let isNegative: boolean;
    
    if (timerType === TimerType.EMERGENCY || timerType === TimerType.DISCONNECT) {
      remainingTime = elapsedSeconds;
      isExpired = false;
      isNegative = false;
    } else {
      const totalDurationSeconds = duration * 60;
      remainingTime = totalDurationSeconds - elapsedSeconds;
      isExpired = remainingTime <= 0;
      isNegative = remainingTime < 0;
    }

    const absTime = Math.abs(remainingTime);
    const minutes = Math.floor(absTime / 60);
    const seconds = absTime % 60;
    const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    let color: TimerColor;
    if (timerType === TimerType.EMERGENCY || timerType === TimerType.DISCONNECT) {
      color = TimerColor.GREEN;
    } else if (isNegative) {
      color = TimerColor.RED;
    } else if (remainingTime <= TIMER_COLOR_THRESHOLDS.RED_THRESHOLD) {
      color = TimerColor.RED;
    } else if (remainingTime <= TIMER_COLOR_THRESHOLDS.YELLOW_THRESHOLD) {
      color = TimerColor.YELLOW;
    } else {
      color = TimerColor.GREEN;
    }

    // EMERGENCY and DISCONNECT always show "+" prefix
    const shouldShowPlus = timerType === TimerType.EMERGENCY || timerType === TimerType.DISCONNECT;
    const finalDisplayTime = shouldShowPlus ? `+${displayTime}` : (isNegative ? `+${displayTime}` : displayTime);

    return {
      type: timerType,
      duration,
      remainingTime,
      isExpired,
      isNegative,
      displayTime: finalDisplayTime,
      color
    };
  }, [stopReason, stoppedAt]);

  useEffect(() => {
    if (!stopReason || !stoppedAt) {
      setTimerInfo(null);
      return;
    }

    setTimerInfo(calculateTimerInfo());

    const interval = setInterval(() => {
      setTimerInfo(calculateTimerInfo());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [stopReason, stoppedAt, calculateTimerInfo, refreshInterval]);

  return timerInfo;
}

