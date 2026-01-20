/**
 * @fileoverview DesktopIcon - Icon component for desktop/Electron indicator
 * @summary SVG icon for desktop app indication
 */

import React from 'react';
import type { IIconProps } from './types';

/**
 * DesktopIcon component for Electron/desktop app indication
 */
export const DesktopIcon: React.FC<IIconProps> = ({ className = '', size = '1.5rem' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: size, height: size }}
  >
    <path
      d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H13L14 19H17C17.5523 19 18 19.4477 18 20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20C6 19.4477 6.44772 19 7 19H10L11 17H5C3.89543 17 3 16.1046 3 15V5Z"
      fill="currentColor"
    />
  </svg>
);

