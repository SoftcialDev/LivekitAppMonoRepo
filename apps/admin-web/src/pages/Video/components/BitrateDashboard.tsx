/**
 * @fileoverview BitrateDashboard - Real-time bandwidth monitoring component
 * @summary Displays current bitrate, data consumption, and projections
 * @description Provides a comprehensive dashboard for monitoring video streaming
 * bandwidth usage with real-time updates and visual indicators.
 */

import React from 'react';
import { useBitrateMonitor } from '../hooks/useBitrateMonitor';

interface BitrateDashboardProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  videoTrack: any;
  className?: string;
}

const formatBitrate = (kbps: number): string => {
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(1)} Mbps`;
  }
  return `${kbps} kbps`;
};

const formatData = (mb: number): string => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(2)} MB`;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const getStatusColor = (bitrate: number): string => {
  if (bitrate === 0) return 'text-gray-400';
  if (bitrate < 500) return 'text-green-400';
  if (bitrate < 1000) return 'text-yellow-400';
  return 'text-red-400';
};

const getStatusIndicatorColor = (bitrate: number): string => {
  if (bitrate === 0) return 'bg-gray-400';
  if (bitrate < 500) return 'bg-green-400';
  if (bitrate < 1000) return 'bg-yellow-400';
  return 'bg-red-400';
};

export const BitrateDashboard: React.FC<BitrateDashboardProps> = ({ videoRef, isStreaming, videoTrack, className = '' }) => {
  
  // Use real video track for accurate bitrate monitoring
  const { metrics } = useBitrateMonitor({ 
    videoTrack: videoTrack,
    isStreaming 
  });

  const {
    currentBitrate,
    dataConsumed,
    hourlyProjection,
    dailyProjection,
    sessionDuration,
    averageBitrate
  } = metrics;

  return (
    <div className={`bg-black/80 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-300">Real-time Bandwidth Monitor</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`}></div>
          <span className="text-sm text-gray-400">
            {isStreaming ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Bitrate</span>
            <div className={`w-2 h-2 rounded-full ${
              currentBitrate === 0 ? 'bg-gray-400' : getStatusIndicatorColor(currentBitrate)
            }`}></div>
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(currentBitrate)}`}>
            {formatBitrate(currentBitrate)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentBitrate > 0 ? 'Active' : isStreaming ? 'Connecting...' : 'Offline'}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Data Consumed</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatData(dataConsumed)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total in session
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Hourly Projection</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatData(hourlyProjection)}/hr
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Estimated
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Daily Projection</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatData(dailyProjection)}/day
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Estimated
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-2">Average Bitrate</div>
          <div className="text-xl font-bold text-white">
            {formatBitrate(averageBitrate)}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-2">Session Duration</div>
          <div className="text-xl font-bold text-white">
            {formatDuration(sessionDuration)}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Status:</span>
            <span className={`font-medium ${
              isStreaming ? 'text-green-400' : 'text-gray-400'
            }`}>
              {isStreaming ? 'Streaming Active' : 'Streaming Inactive'}
            </span>
            {isStreaming && (
              <span className="text-blue-400 text-xs">
                Video Track: Connected
              </span>
            )}
            {!isStreaming && (
              <span className="text-gray-400 text-xs">
                Video Track: Disconnected
              </span>
            )}
          </div>
          <div className="text-gray-500">
            Updated every 5s
          </div>
        </div>
      </div>
    </div>
  );
};