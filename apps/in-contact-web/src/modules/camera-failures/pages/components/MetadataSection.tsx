/**
 * @fileoverview MetadataSection component
 * @summary Component for displaying metadata section
 * @description Renders the metadata section in failure details
 */

import React from 'react';
import type { IMetadataSectionProps } from './types';

/**
 * MetadataSection component - displays metadata section
 * @param props - Component props
 * @returns React component or null if no metadata
 */
export const MetadataSection: React.FC<IMetadataSectionProps> = ({ metadata }) => {
  if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-600 pt-4">
      <h3 className="text-white font-semibold mb-3 text-lg">Metadata</h3>
      <div className="bg-(--color-primary) p-4 rounded-lg">
        <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap wrap-break-word">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
};

