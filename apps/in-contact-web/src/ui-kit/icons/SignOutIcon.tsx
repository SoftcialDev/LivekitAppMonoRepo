/**
 * @fileoverview SignOutIcon - Icon component for sign out action
 * @summary SVG icon for sign out button
 * @description Reusable icon component for sign out functionality.
 * Uses CSS variables for stroke color theming.
 */

import React from 'react';
import type { IIconProps } from './types';

/**
 * SignOutIcon component
 * 
 * SVG icon representing a sign out action (person exiting with arrow).
 * Uses var(--color-secondary) for stroke color.
 * 
 * @param props.className - Additional CSS classes to apply
 * @param props.size - Size of the icon (width and height)
 * @returns SVG icon element
 */
export const SignOutIcon: React.FC<IIconProps> = ({ className = '', size = '1.75rem' }) => (
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
      {/* Use var(--color-secondary) for stroke */}
      <polyline
        points="18 9 21 12 18 15"
        style={{
          fill: 'none',
          stroke: 'var(--color-secondary)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
        }}
      />
      <line
        x1="21"
        y1="12"
        x2="7"
        y2="12"
        style={{
          fill: 'none',
          stroke: 'var(--color-secondary)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
        }}
      />
      <path
        d="M14,16v3a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V5A1,1,0,0,1,4,4h9a1,1,0,0,1,1,1V8"
        style={{
          fill: 'none',
          stroke: 'var(--color-secondary)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
        }}
      />
    </g>
  </svg>
);

