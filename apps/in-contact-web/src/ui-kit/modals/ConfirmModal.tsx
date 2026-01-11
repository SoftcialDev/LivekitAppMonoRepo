/**
 * @fileoverview ConfirmModal - Specialized modal for simple confirmation dialogs
 * @summary Confirmation modal with message, cancel, and confirm buttons
 * @description Use this modal for simple confirmation dialogs like delete confirmations.
 * Provides a standardized pattern with message display and action buttons.
 */

import React from 'react';
import type { IConfirmModalProps } from './types';
import { BaseModal } from './BaseModal';
import { ModalHeader, ModalBody, ModalFooter } from './components';

/**
 * ConfirmModal component
 * 
 * Specialized modal for simple confirmation dialogs. Displays a message
 * and provides cancel and confirm buttons.
 * 
 * @param props - Component props
 * @returns JSX element with confirmation modal
 */
export const ConfirmModal: React.FC<IConfirmModalProps> = ({
  open,
  title,
  iconSrc,
  iconAlt,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  className = 'w-fit',
}) => (
  <BaseModal
    open={open}
    onClose={onClose}
    className={className}
    draggable={false}
    customHeader={
      <ModalHeader
        title={title}
        iconSrc={iconSrc}
        iconAlt={iconAlt}
        onClose={onClose}
        draggable={false}
      />
    }
    customFooter={
      <ModalFooter
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        confirmDisabled={confirmDisabled}
      />
    }
  >
    <ModalBody padding="px-6 py-4" scrollable={false}>
      {typeof message === 'string' ? (
        <p className="text-white">{message}</p>
      ) : (
        message
      )}
    </ModalBody>
  </BaseModal>
);

