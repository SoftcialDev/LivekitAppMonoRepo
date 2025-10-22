import React from 'react';
import { TimerInfo } from '../hooks/useSynchronizedTimer';

interface TimerDisplayProps {
  timerInfo: TimerInfo | null;
  className?: string;
  showLabel?: boolean;
}

/**
 * Componente para mostrar el timer con colores y formato
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timerInfo, 
  className = '',
  showLabel = true 
}) => {
  if (!timerInfo) {
    return null;
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-500 bg-green-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'red':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'LUNCH_BREAK':
        return 'Lunch';
      case 'SHORT_BREAK':
        return 'Short Break';
      case 'QUICK_BREAK':
        return 'Quick Break';
      case 'EMERGENCY':
        return 'Emergency';
      default:
        return 'Timer';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          {getLabel(timerInfo.type)}:
        </span>
      )}
      <div className={`px-2 py-1 rounded-md font-mono text-sm font-bold ${getColorClasses(timerInfo.color)}`}>
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
 * Componente compacto para mostrar solo el tiempo (sin fondo, números grandes)
 */
export const CompactTimer: React.FC<{ timerInfo: TimerInfo | null }> = ({ timerInfo }) => {
  if (!timerInfo) {
    return null;
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-500';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`font-mono text-3xl font-bold ${getColorClasses(timerInfo.color)}`}>
        {timerInfo.displayTime}
      </span>
    </div>
  );
};
