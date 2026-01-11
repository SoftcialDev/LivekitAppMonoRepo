/**
 * @fileoverview ModalBody - Reusable body component for modals
 * @summary Body with loading overlay support and customizable styling
 * @description Standardized body component for modals with optional loading overlay.
 */

import React from 'react';
import type { IModalBodyProps } from '../types';
import { Loading } from '@/ui-kit/feedback';

/**
 * ModalBody component
 * 
 * Renders a modal body with:
 * - Customizable padding and text color
 * - Optional loading overlay with spinner
 * - Scrollable content support
 * - Configurable max height
 * 
 * @param props - Component props
 * @returns JSX element with modal body
 */
export const ModalBody: React.FC<IModalBodyProps> = ({
  children,
  loading = false,
  loadingAction = 'Loading…',
  padding = 'px-6 py-2',
  textColor = 'text-white',
  scrollable = true,
  maxHeight = 'max-h-[60vh]',
}) => (
  <div className={`relative ${padding} ${textColor} bg-(--color-primary-light) flex flex-col flex-1 min-h-0`}>
    {loading && (
      <div className="absolute inset-0 z-10">
        <Loading action={loadingAction} bgClassName="bg-[var(--color-primary)]" />
      </div>
    )}
    <div
      className={`
        ${scrollable ? `overflow-y-auto ${maxHeight}` : 'flex-1'}
        flex-1 min-h-0
      `}
    >
      {children}
    </div>
  </div>
);

