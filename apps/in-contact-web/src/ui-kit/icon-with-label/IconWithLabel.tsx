/**
 * @fileoverview IconWithLabel component
 * @summary Renders an icon alongside a label
 * @description Component for displaying an icon with text label in a single line
 */

import React from 'react';
import type { IIconWithLabelProps } from './types/iconWithLabelTypes';

/**
 * IconWithLabel component
 * 
 * Renders an icon alongside a label, with configurable sizing and container behavior.
 * Ensures icon and text stay on the same line via flex and whitespace-nowrap.
 * 
 * @param props - Component props
 * @returns JSX element with icon and label
 * 
 * @example
 * ```tsx
 * <IconWithLabel
 *   src={logo}
 *   alt="Logo"
 *   imgSize="h-8"
 *   textSize="text-xl"
 * >
 *   In Contact
 * </IconWithLabel>
 * ```
 */
export const IconWithLabel: React.FC<IIconWithLabelProps> = ({
  src,
  alt = 'Icon',
  imgSize = 'h-8 sm:h-10 md:h-12',
  textSize = 'text-xl sm:text-2xl md:text-3xl',
  fillContainer = false,
  className = 'flex items-center whitespace-nowrap mb-6 mt-8',
  children,
}) => {
  // Build wrapper classes
  const wrapperClasses = [className, fillContainer ? 'w-full h-full' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <img src={src} alt={alt} className={`${imgSize} mr-3 flex-shrink-0`} />
      <span className={`montserrat-bold text-white ${textSize} whitespace-nowrap`}>
        {children}
      </span>
    </div>
  );
};

