/**
 * @fileoverview AttemptItem component
 * @summary Component for displaying a single attempt in the failure details
 * @description Renders attempt information in a card format
 */

import React from 'react';
import { DetailField } from '@/ui-kit/details';
import type { IAttemptItemProps } from './types';

/**
 * AttemptItem component - displays a single attempt's details
 * @param props - Component props
 * @returns React component
 */
export const AttemptItem: React.FC<IAttemptItemProps> = ({ attempt, index }) => {
  return (
    <div className="bg-(--color-primary) p-4 rounded-lg">
      <h4 className="font-semibold text-gray-300 mb-2">Attempt {index + 1}</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {attempt.label && (
          <DetailField label="Label" value={attempt.label} />
        )}
        {attempt.deviceId && (
          <DetailField label="Device ID" value={attempt.deviceId} monospace={true} />
        )}
        {attempt.deviceIdHash && (
          <DetailField label="Device ID Hash" value={attempt.deviceIdHash} monospace={true} />
        )}
        {attempt.result && (
          <DetailField label="Result" value={attempt.result} />
        )}
        {attempt.errorName && (
          <DetailField label="Error Name" value={attempt.errorName} />
        )}
        {attempt.errorMessage && (
          <div className="col-span-2">
            <DetailField
              label="Error Message"
              value={attempt.errorMessage}
              valueClassName="whitespace-pre-wrap wrap-break-word"
            />
          </div>
        )}
      </div>
    </div>
  );
};

