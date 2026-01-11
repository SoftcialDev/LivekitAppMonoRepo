/**
 * @fileoverview ModalFooter - Reusable footer component for modals
 * @summary Footer with cancel and confirm buttons
 * @description Standardized footer component for modals with action buttons.
 */

import React from 'react';
import type { IModalFooterProps } from '../types';
import { CancelButton, AddButton } from '@/ui-kit/buttons';

/**
 * ModalFooter component
 * 
 * Renders a modal footer with:
 * - Cancel button (left side, optional - only if cancelLabel is provided)
 * - Optional children content (between buttons)
 * - Confirm/Primary button (right side)
 * - Disabled state support for both buttons
 * 
 * @param props - Component props
 * @returns JSX element with modal footer
 */
export const ModalFooter: React.FC<IModalFooterProps> = ({
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel,
  confirmDisabled = false,
  cancelDisabled = false,
  children,
}) => (
  <div className="flex justify-end items-center space-x-5 px-6 py-2 pb-10">
    {cancelLabel && cancelLabel.trim() !== '' && onCancel && (
      <CancelButton 
        onClick={onCancel} 
        label={cancelLabel}
        disabled={cancelDisabled}
      />
    )}
    {children}
    <AddButton 
      label={confirmLabel} 
      onClick={onConfirm}
      disabled={confirmDisabled}
    />
  </div>
);

