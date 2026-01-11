/**
 * @fileoverview PreviewModal - Specialized modal for previewing content
 * @summary Preview modal without footer for images, videos, etc.
 * @description Use this modal for previewing content like images or videos.
 * No footer buttons - just header with close button.
 */

import React from 'react';
import type { IPreviewModalProps } from './types';
import { BaseModal } from './BaseModal';
import { ModalHeader, ModalBody } from './components';

/**
 * PreviewModal component
 * 
 * Specialized modal for previewing content (images, videos, etc.) without footer.
 * Just displays content with a header and close button.
 * 
 * @param props - Component props
 * @returns JSX element with preview modal
 */
export const PreviewModal: React.FC<IPreviewModalProps> = ({
  open,
  title,
  iconSrc,
  iconAlt,
  children,
  onClose,
  maxWidth = 'w-[90vw] max-w-6xl',
  className = '',
}) => (
  <BaseModal
    open={open}
    onClose={onClose}
    className={`${maxWidth} ${className}`}
    draggable={true}
    customHeader={
      <ModalHeader
        title={title}
        iconSrc={iconSrc}
        iconAlt={iconAlt}
        onClose={onClose}
        draggable={true}
      />
    }
  >
    <ModalBody
      padding="p-2"
      scrollable={true}
      maxHeight="max-h-[85vh]"
    >
      <div className="flex items-center justify-center min-h-[40vh]">
        {children}
      </div>
    </ModalBody>
  </BaseModal>
);

