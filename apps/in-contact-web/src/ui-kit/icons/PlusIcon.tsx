/**
 * @fileoverview PlusIcon - SVG icon for add/plus actions
 * @summary Plus "+" symbol for add/confirm actions
 * @description Reusable plus icon component. Adjust size using Tailwind
 * utility classes (e.g., `w-6 h-6`) on the root `<svg>` element.
 */

import React from 'react';
import type { IPlusIconProps } from './types';

/**
 * PlusIcon component
 * 
 * Renders a "+" symbol (cross) for add/confirm actions.
 * Size can be customized via className prop.
 * 
 * @param props - Component props
 * @returns React element rendering the plus icon
 */
export const PlusIcon: React.FC<IPlusIconProps> = ({ 
  className = 'w-10 h-10' 
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    stroke="currentColor"
    strokeWidth={2}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

