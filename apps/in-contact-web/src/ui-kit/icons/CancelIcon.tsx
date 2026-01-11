/**
 * @fileoverview CancelIcon - SVG icon for cancel/close actions
 * @summary Circular "×" symbol in secondary theme color
 * @description Reusable cancel/close icon component. Adjust size using Tailwind
 * utility classes (e.g., `w-6 h-6`) on the root `<svg>` element.
 */

import React from 'react';
import type { ICancelIconProps } from './types';

/**
 * CancelIcon component
 * 
 * Renders a circular "×" symbol in the secondary theme color.
 * Size can be customized via className prop.
 * 
 * @param props - Component props
 * @returns React element rendering the cancel icon
 */
export const CancelIcon: React.FC<ICancelIconProps> = ({ 
  className = 'w-7 h-7' 
}) => (
  <svg
    viewBox="0 0 16 16"
    fill="#ABDE80"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g>
      <path d="M13,3.05A7,7,0,1,0,13,13,7,7,0,0,0,13,3.05ZM12,12A5.6,5.6,0,0,1,4,12,5.61,5.61,0,0,1,4,4,5.6,5.6,0,0,1,12,4,5.61,5.61,0,0,1,12,12ZM10.65,4.08,8,6.73,5.35,4.08,4.08,5.35,6.73,8,4.08,10.65l1.27,1.27L8,9.27l2.65,2.65,1.27-1.27L9.27,8l2.65-2.65Z" />
    </g>
  </svg>
);

