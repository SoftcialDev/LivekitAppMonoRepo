/**
 * @fileoverview DetailField - Reusable component for label-value pairs in detail views
 * @summary Displays a label and value in a consistent format
 * @description Reusable component for displaying structured information in detail views,
 * modals, and forms. Provides consistent styling and layout for label-value pairs.
 */

import React from 'react';
import type { IDetailFieldProps } from './types';

/**
 * DetailField component
 * 
 * Displays a label-value pair with consistent styling. Commonly used in
 * detail modals and pages to show structured information.
 * 
 * @param props - Component props
 * @returns JSX element with label and value
 * 
 * @example
 * ```tsx
 * <DetailField
 *   label="ID"
 *   value={errorLog.id}
 *   monospace={true}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * <DetailField
 *   label="Status"
 *   value={
 *     <span className={isActive ? 'text-green-500' : 'text-red-500'}>
 *       {isActive ? 'Active' : 'Inactive'}
 *     </span>
 *   }
 * />
 * ```
 */
export const DetailField: React.FC<IDetailFieldProps> = ({
  label,
  value,
  monospace = false,
  valueClassName = '',
  labelClassName = 'text-gray-400 text-sm',
  className = '',
}) => (
  <div className={className}>
    <label className={labelClassName}>{label}</label>
    <p
      className={`
        text-white
        ${monospace ? 'font-mono text-sm' : ''}
        ${valueClassName}
      `.trim()}
    >
      {value}
    </p>
  </div>
);

