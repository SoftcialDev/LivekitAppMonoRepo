/**
 * @fileoverview DetailsModal - Specialized modal for displaying detailed information
 * @summary Read-only details modal with header actions support
 * @description Use this modal for displaying detailed information about entities.
 * Supports header actions (e.g., "Copy" button) and scrollable content.
 */

import React from 'react';
import type { IDetailsModalProps } from './types';
import { BaseModal } from './BaseModal';
import { ModalHeader, ModalBody } from './components';

/**
 * DetailsModal component
 * 
 * Specialized modal for displaying detailed information (read-only view).
 * Typically used for entity details, error logs, etc. Supports header actions
 * for additional operations like copying details.
 * 
 * @param props - Component props
 * @returns JSX element with details modal
 */
export const DetailsModal: React.FC<IDetailsModalProps> = ({
  open,
  title,
  iconSrc,
  iconAlt,
  children,
  onClose,
  headerActions,
  maxWidth = 'max-w-4xl',
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
        actions={headerActions}
        draggable={true}
      />
    }
  >
    <ModalBody
      padding="px-6 py-6"
      scrollable={true}
      maxHeight="max-h-[80vh]"
    >
      {children}
    </ModalBody>
  </BaseModal>
);

