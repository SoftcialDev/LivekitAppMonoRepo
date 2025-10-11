/**
 * @fileoverview useBitrateMonitor - Real-time bitrate monitoring hook
 * @summary Monitors video bitrate and calculates data consumption metrics
 * @description Provides real-time bitrate monitoring using WebRTC statistics
 * and fallback estimation based on video resolution and frame rate.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalVideoTrack } from 'livekit-client';

interface BitrateMonitorProps {
  videoTrack: LocalVideoTrack | MediaStreamTrack | null;
  isStreaming: boolean;
}

export interface BitrateMetrics {
  currentBitrate: number;
  dataConsumed: number;
  hourlyProjection: number;
  dailyProjection: number;
  sessionDuration: number;
  averageBitrate: number;
}

export function useBitrateMonitor({ videoTrack, isStreaming }: BitrateMonitorProps) {
  const [metrics, setMetrics] = useState<BitrateMetrics>({
    currentBitrate: 0,
    dataConsumed: 0,
    hourlyProjection: 0,
    dailyProjection: 0,
    sessionDuration: 0,
    averageBitrate: 0
  });

  const sessionStartRef = useRef<number>(Date.now());
  const dataConsumedRef = useRef<number>(0);
  const bitrateHistoryRef = useRef<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatsRef = useRef<{ bytesSent: number; timestamp: number } | null>(null);

  const getRealBitrate = useCallback(async (): Promise<number> => {
    try {
      // Use LiveKit's getSenderStats() for real bitrate data
      if (videoTrack && (videoTrack as any).getSenderStats) {
        const senderStats = await (videoTrack as any).getSenderStats();
        
        if (senderStats && senderStats.length > 0) {
          // Get the first sender stat (usually the main video stream)
          const stat = senderStats[0];
          const targetBitrate = stat.targetBitrate || 0;
          
          // Convert from bps to kbps
          const bitrateKbps = Math.round(targetBitrate / 1000);
          console.log('[BitrateMonitor] Real bitrate from sender stats:', bitrateKbps, 'kbps');
          return bitrateKbps;
        }
      }
      
      // No fallback - return 0 if no real data available
      return 0;
    } catch (error) {
      console.warn('[BitrateMonitor] Failed to get bitrate:', error);
      return 0;
    }
  }, [videoTrack]);

  const estimateCurrentBitrate = useCallback(async (): Promise<number> => {
    if (!isStreaming) {
      return 0;
    }
    
    // Use the safer estimation method
    return await getRealBitrate();
  }, [isStreaming, getRealBitrate]);

  const updateMetrics = useCallback(async () => {
    if (!isStreaming) {
      setMetrics(prev => ({
        ...prev,
        currentBitrate: 0,
        hourlyProjection: 0,
        dailyProjection: 0
      }));
      return;
    }

    const currentBitrate = await estimateCurrentBitrate();
    const now = Date.now();
    const sessionDuration = Math.floor((now - sessionStartRef.current) / 1000);
    
    // Calculate data consumed in this 5-second interval
    const intervalSeconds = 5; // Update interval
    const dataConsumedThisUpdate = (currentBitrate * 1000 * intervalSeconds) / (8 * 1024 * 1024);
    dataConsumedRef.current += dataConsumedThisUpdate;
    
    bitrateHistoryRef.current.push(currentBitrate);
    if (bitrateHistoryRef.current.length > 60) {
      bitrateHistoryRef.current.shift();
    }
    
    const averageBitrate = bitrateHistoryRef.current.length > 0 
      ? bitrateHistoryRef.current.reduce((sum, rate) => sum + rate, 0) / bitrateHistoryRef.current.length
      : currentBitrate;
    
    const hourlyProjection = (averageBitrate * 3600) / (8 * 1024);
    const dailyProjection = hourlyProjection * 24;
    
    setMetrics({
      currentBitrate,
      dataConsumed: Math.round(dataConsumedRef.current * 100) / 100,
      hourlyProjection: Math.round(hourlyProjection * 100) / 100,
      dailyProjection: Math.round(dailyProjection * 100) / 100,
      sessionDuration,
      averageBitrate: Math.round(averageBitrate * 100) / 100
    });
  }, [isStreaming, estimateCurrentBitrate]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      return;
    }
    
    sessionStartRef.current = Date.now();
    dataConsumedRef.current = 0;
    bitrateHistoryRef.current = [];
    lastStatsRef.current = null;
    
    updateMetrics();
    intervalRef.current = setInterval(updateMetrics, 5000);
  }, [updateMetrics]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMetrics({
      currentBitrate: 0,
      dataConsumed: 0,
      hourlyProjection: 0,
      dailyProjection: 0,
      sessionDuration: 0,
      averageBitrate: 0
    });
    lastStatsRef.current = null;
  }, []);

  useEffect(() => {
    if (isStreaming) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    return () => stopMonitoring();
  }, [isStreaming, startMonitoring, stopMonitoring]);

  return { metrics };
}