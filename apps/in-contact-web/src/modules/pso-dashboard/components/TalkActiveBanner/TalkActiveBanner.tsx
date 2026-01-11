/**
 * @fileoverview TalkActiveBanner - Banner component for active talk sessions
 * @summary Displays a banner when a talk session is active
 * @description Renders a visual indicator banner that appears when a PSO is in an active
 * talk session with a supervisor. The banner displays the supervisor's name and provides
 * visual feedback that a call is in progress. Shows "Incoming call" during the first 3 seconds,
 * then switches to "Active call".
 */

import React from 'react';
import type { ITalkActiveBannerProps } from './types/talkActiveBannerTypes';

/**
 * Banner component that displays when a talk session is active
 *
 * @param props - Component props
 * @returns Banner element or null if not active
 */
export const TalkActiveBanner: React.FC<ITalkActiveBannerProps> = ({
  isActive,
  isIncoming,
  justEnded,
  supervisorName,
}) => {
  if (!isActive && !justEnded) {
    return null;
  }

  let displayText: string;
  let textSize: string;

  if (isIncoming) {
    displayText = `Incoming call from: ${supervisorName}`;
    textSize = 'text-xl font-semibold';
  } else if (justEnded) {
    displayText = `Call ended with ${supervisorName}`;
    textSize = 'font-semibold';
  } else {
    displayText = `Active call with ${supervisorName}`;
    textSize = 'font-semibold';
  }

  return (
    <div className="absolute top-0 left-0 right-0 bg-(--color-secondary) text-(--color-primary-dark) px-6 py-3 z-50 flex items-center justify-center gap-4 shadow-lg">
      {!justEnded && (
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ABDE80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.05 6A5 5 0 0118 10m-3.95-8a9 9 0 018 7.94m0 7v3a2 2 0 01-2 2h-.19a19.79 19.79 0 01-8.63-3.07 19.52 19.52 0 01-6-6 19.82 19.82 0 01-3.11-8.69A2 2 0 013.93 2h3.18a2 2 0 012 1.72 13 13 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 13 13 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
        </div>
      )}
      <span className={textSize}>{displayText}</span>
    </div>
  );
};

