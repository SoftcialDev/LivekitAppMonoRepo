/**
 * @fileoverview TimerDisplay component
 * @summary Component for displaying synchronized timers
 * @description Displays timer with colors and formatting for breaks and emergencies
 */

import React from 'react';
import type { ITimerDisplayProps, ICompactTimerProps } from './types';
import { TIMER_LABELS, TIMER_COLOR_CLASSES, TIMER_COLOR_CLASSES_COMPACT } from '../constants';

/**
 * Component for displaying timer with colors and formatting
 */
export const TimerDisplay: React.FC<ITimerDisplayProps> = ({ 
  timerInfo, 
  className = '',
  showLabel = true 
}) => {
  if (!timerInfo) {
    return null;
  }

  const colorClasses = TIMER_COLOR_CLASSES[timerInfo.color] ?? 'text-gray-600 bg-gray-100';
  const label = TIMER_LABELS[timerInfo.type] ?? 'Timer';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          {label}:
        </span>
      )}
      <div className={`px-2 py-1 rounded-md font-mono text-sm font-bold ${colorClasses}`}>
        {timerInfo.displayTime}
      </div>
      {timerInfo.isNegative && (
        <span className="text-xs text-red-500 font-medium">
          Overdue
        </span>
      )}
    </div>
  );
};

/**
 * Compact component for displaying only the time (without background, large numbers)
 */
export const CompactTimer: React.FC<ICompactTimerProps> = ({ timerInfo }) => {
  if (!timerInfo) {
    return null;
  }

  const colorClasses = TIMER_COLOR_CLASSES_COMPACT[timerInfo.color] ?? 'text-gray-600';

  return (
    <div className="flex flex-col items-center">
      <span className={`font-mono text-3xl font-bold ${colorClasses}`}>
        {timerInfo.displayTime}
      </span>
    </div>
  );
};

