/**
 * @fileoverview TransferIcon - Icon component for transfer action
 * @summary SVG icon for transfer buttons
 * @description Reusable icon component for transfer functionality.
 * Uses CSS variables for fill color theming.
 */

import React from 'react';
import type { IIconProps } from './types';

/**
 * TransferIcon component
 * 
 * SVG icon representing a transfer/arrow right action.
 * Uses currentColor for fill color.
 * 
 * @param props.className - Additional CSS classes to apply
 * @param props.size - Size of the icon (width and height)
 * @returns SVG icon element
 */
export const TransferIcon: React.FC<IIconProps> = ({ className = '', size = '1.5rem' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: size, height: size }}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0" />
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
    <g id="SVGRepo_iconCarrier">
      <path
        d="M7 17L17 7M17 7H7M17 7V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

