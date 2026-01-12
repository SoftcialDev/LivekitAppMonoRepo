/**
 * @fileoverview AttemptsSection component
 * @summary Component for displaying attempts section
 * @description Renders the attempts section in failure details
 */

import React from 'react';
import { AttemptItem } from './AttemptItem';
import type { IAttemptsSectionProps } from './types';

/**
 * AttemptsSection component - displays attempts section
 * @param props - Component props
 * @returns React component or null if no attempts
 */
export const AttemptsSection: React.FC<IAttemptsSectionProps> = ({ attempts }) => {
  if (!attempts || !Array.isArray(attempts) || attempts.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-600 pt-4">
      <h3 className="text-white font-semibold mb-3 text-lg">
        Attempts ({attempts.length})
      </h3>
      <div className="space-y-4">
        {attempts.map((attempt, index) => {
          const key = attempt.deviceIdHash || attempt.deviceId || attempt.label || `attempt-${index}`;
          return <AttemptItem key={key} attempt={attempt} index={index} />;
        })}
      </div>
    </div>
  );
};

