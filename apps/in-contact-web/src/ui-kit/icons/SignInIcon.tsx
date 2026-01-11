/**
 * @fileoverview SignInIcon - Icon component for sign in action
 * @summary SVG icon for sign in button
 * @description Reusable icon component for sign in functionality.
 * Uses currentColor for easy theming.
 */

import React from 'react';
import type { IIconProps } from './types';

/**
 * SignInIcon component
 * 
 * SVG icon representing a sign in action (person entering).
 * Uses currentColor for easy theming.
 * 
 * @param props.className - Additional CSS classes to apply
 * @param props.size - Size of the icon (width and height)
 * @returns SVG icon element
 */
export const SignInIcon: React.FC<IIconProps> = ({ className = '', size = '1em' }) => (
  <svg
    className={className}
    style={{ width: size, height: size }}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g
      transform="translate(0 24) scale(0.1 -0.1)"
      fill="currentColor"
      stroke="none"
    >
      <path d="M52 208 c-16 -16 -16 -160 0 -176 16 -16 120 -16 136 0 15 15 16 58 2 58 -5 0 -10 -11 -10 -25 0 -24 -3 -25 -60 -25 l-60 0 0 80 0 80 60 0 c57 0 60 -1 60 -25 0 -14 5 -25 10 -25 14 0 13 43 -2 58 -16 16 -120 16 -136 0z"/>
      <path d="M100 145 l-24 -26 27 -26 c27 -28 50 -26 27 2 -11 13 -7 15 29 15 22 0 41 5 41 10 0 6 -19 10 -42 10 -33 0 -39 3 -30 12 7 7 12 16 12 20 0 15 -17 8 -40 -17z"/>
    </g>
  </svg>
);

