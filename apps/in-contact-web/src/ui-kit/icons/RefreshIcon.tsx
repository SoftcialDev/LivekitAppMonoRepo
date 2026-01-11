/**
 * @fileoverview RefreshIcon - SVG icon for refresh/reload actions
 * @summary Refresh icon component with custom size support
 * @description Reusable refresh icon component. Adjust size using Tailwind
 * utility classes or size prop. Icon made by Arkinasi from www.flaticon.com
 */

import React from 'react';
import type { IIconProps } from './types';

/**
 * Props for RefreshIcon component
 */
export interface IRefreshIconProps extends Omit<IIconProps, 'size'> {
  /**
   * Size of the icon (width and height)
   * 
   * @default 16
   */
  size?: number;
}

/**
 * RefreshIcon component
 * 
 * Renders a refresh/reload icon.
 * Size can be customized via size prop (number) or className prop.
 * 
 * @param props - Component props
 * @returns React element rendering the refresh icon
 */
export const RefreshIcon: React.FC<IRefreshIconProps> = ({ 
  className = '',
  size = 16
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    x="0px" 
    y="0px" 
    width={size} 
    height={size} 
    viewBox="0,0,256,256"
    className={className}
  >
    <g fill="none" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" style={{ mixBlendMode: 'normal' }}>
      <g transform="scale(6.4,6.4)">
        <path d="M4.207,35.5l2.573,-2.574l-0.328,-0.353c-3.193,-3.43 -4.952,-7.896 -4.952,-12.573c0,-10.201 8.299,-18.5 18.5,-18.5c0.776,0 1.598,0.062 2.5,0.19v4.032c-0.839,-0.147 -1.677,-0.222 -2.5,-0.222c-7.995,0 -14.5,6.505 -14.5,14.5c0,3.578 1.337,7.023 3.765,9.701l0.353,0.389l2.883,-2.883v8.293z" fill="#abde80"></path>
        <path d="M20,2c0.627,0 1.287,0.042 2,0.129v3.009c-0.67,-0.092 -1.339,-0.138 -2,-0.138c-8.271,0 -15,6.729 -15,15c0,3.702 1.383,7.267 3.894,10.037l0.705,0.778l0.743,-0.743l1.658,-1.658v6.586h-6.586l1.379,-1.379l0.682,-0.682l-0.657,-0.706c-3.107,-3.338 -4.818,-7.682 -4.818,-12.233c0,-9.925 8.075,-18 18,-18M20,1c-10.493,0 -19,8.507 -19,19c0,4.994 1.934,9.527 5.086,12.914l-3.086,3.086h10v-10l-3.365,3.365c-2.248,-2.48 -3.635,-5.753 -3.635,-9.365c0,-7.732 6.268,-14 14,-14c1.031,0 2.033,0.119 3,0.33v-5.071c-0.98,-0.155 -1.977,-0.259 -3,-0.259z" fill="#764e9f"></path>
        <g>
          <path d="M20,38.5c-0.776,0 -1.598,-0.062 -2.5,-0.19v-4.032c0.839,0.147 1.677,0.222 2.5,0.222c7.995,0 14.5,-6.505 14.5,-14.5c0,-3.583 -1.336,-7.03 -3.761,-9.706l-0.353,-0.389l-2.886,2.888v-8.293h8.293l-2.581,2.582l0.328,0.354c3.198,3.436 4.96,7.898 4.96,12.564c0,10.201 -8.299,18.5 -18.5,18.5z" fill="#abde80"></path>
          <path d="M34.586,5l-1.387,1.387l-0.682,0.682l0.657,0.706c3.112,3.344 4.826,7.686 4.826,12.225c0,9.925 -8.075,18 -18,18c-0.627,0 -1.287,-0.042 -2,-0.129v-3.009c0.67,0.092 1.339,0.138 2,0.138c8.271,0 15,-6.729 15,-15c0,-3.708 -1.381,-7.274 -3.89,-10.041l-0.705,-0.778l-0.743,0.743l-1.662,1.662v-6.586h6.586M37,4h-10v10l3.369,-3.369c2.249,2.48 3.631,5.757 3.631,9.369c0,7.732 -6.268,14 -14,14c-1.031,0 -2.033,-0.119 -3,-0.33v5.071c0.98,0.155 1.977,0.259 3,0.259c10.493,0 19,-8.507 19,-19c0,-4.993 -1.942,-9.519 -5.094,-12.906l3.094,-3.094z" fill="#764e9f"></path>
        </g>
      </g>
    </g>
  </svg>
);

