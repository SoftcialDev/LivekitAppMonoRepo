/**
 * @fileoverview FailureDetailsContent component
 * @summary Component for displaying failure details content
 * @description Renders the main content of the failure details modal
 */

import React from 'react';
import { DetailField } from '@/ui-kit/details';
import { getStageColorClass, formatCameraFailureDate } from '../../utils/cameraFailureUtils';
import { DevicesSection } from './DevicesSection';
import { AttemptsSection } from './AttemptsSection';
import { MetadataSection } from './MetadataSection';
import type { IFailureDetailsContentProps } from './types';

/**
 * FailureDetailsContent component - displays failure details
 * @param props - Component props
 * @returns React component
 */
export const FailureDetailsContent: React.FC<IFailureDetailsContentProps> = ({ failure }) => {
  return (
    <div className="space-y-4 text-sm">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <DetailField
          label="ID"
          value={failure.id}
          monospace={true}
        />
        <DetailField
          label="User Email"
          value={failure.userEmail || 'N/A'}
        />
        <DetailField
          label="User AD ID"
          value={failure.userAdId}
          monospace={true}
        />
        <DetailField
          label="Stage"
          value={
            <span className={getStageColorClass(failure.stage)}>
              {failure.stage}
            </span>
          }
        />
        <DetailField
          label="Error Name"
          value={failure.errorName || 'N/A'}
        />
        <DetailField
          label="Device Count"
          value={failure.deviceCount ?? 'N/A'}
        />
        <DetailField
          label="Created"
          value={formatCameraFailureDate(failure.createdAt)}
        />
        {failure.createdAtCentralAmerica && (
          <DetailField
            label="Created (Central America)"
            value={failure.createdAtCentralAmerica}
          />
        )}
      </div>

      {/* Error Message */}
      <DetailField
        label="Error Message"
        value={failure.errorMessage || 'N/A'}
        valueClassName="whitespace-pre-wrap wrap-break-word"
      />

      {/* Devices Snapshot */}
      <DevicesSection devices={failure.devicesSnapshot || []} />

      {/* Attempts */}
      <AttemptsSection attempts={failure.attempts || []} />

      {/* Metadata */}
      <MetadataSection metadata={failure.metadata} />
    </div>
  );
};

