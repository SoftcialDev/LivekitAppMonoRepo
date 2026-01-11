/**
 * @fileoverview ModalHeader - Reusable header component for modals
 * @summary Header with title, icon, close button, and optional actions
 * @description Standardized header component for modals with drag handle support.
 */

import React from 'react';
import type { IModalHeaderProps } from '../types';
import { CancelIcon } from '@/ui-kit/icons';

/**
 * ModalHeader component
 * 
 * Renders a modal header with:
 * - Title (text or React node) with optional icon
 * - Close button (X icon)
 * - Optional additional actions on the right
 * - Draggable support (cursor-move when enabled)
 * 
 * @param props - Component props
 * @returns JSX element with modal header
 */
export const ModalHeader: React.FC<IModalHeaderProps> = ({
  title,
  iconSrc,
  iconAlt,
  onClose,
  actions,
  draggable = true,
  onMouseDown,
}) => (
  <div
    onMouseDown={onMouseDown}
    className={`
      flex items-center justify-between px-6 py-4
      ${draggable ? 'cursor-move' : ''}
    `}
  >
    <div className="flex items-center space-x-2 text-white text-lg font-semibold">
      {iconSrc && <img src={iconSrc} alt={iconAlt} className="w-6 h-6" />}
      {typeof title === 'string' ? <span>{title}</span> : title}
    </div>
    <div className="flex items-center gap-2">
      {actions}
      <button 
        onClick={onClose} 
        className="leading-none" 
        aria-label="Close"
        type="button"
      >
        <CancelIcon className="w-7 h-7" />
      </button>
    </div>
  </div>
);

