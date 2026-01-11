/**
 * @fileoverview FormModal - Specialized modal for forms with loading state
 * @summary Form modal with submit/cancel buttons and loading overlay
 * @description Use this modal for forms that require submission. Provides loading
 * overlay during submission and standardized submit/cancel buttons.
 */

import React from 'react';
import type { IFormModalProps } from './types';
import { BaseModal } from './BaseModal';
import { ModalHeader, ModalBody, ModalFooter } from './components';

/**
 * FormModal component
 * 
 * Specialized modal for forms with loading state during submission.
 * Provides loading overlay and standardized submit/cancel buttons.
 * 
 * @param props - Component props
 * @returns JSX element with form modal
 */
export const FormModal: React.FC<IFormModalProps> = ({
  open,
  title,
  iconSrc,
  iconAlt,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  loadingAction = 'Submitting…',
  submitDisabled = false,
  maxWidth = 'w-[600px] max-w-[90vw]',
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
    customFooter={
      <ModalFooter
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmLabel={submitLabel}
        cancelLabel={cancelLabel}
        confirmDisabled={submitDisabled || loading}
      />
    }
  >
    <ModalBody
      loading={loading}
      loadingAction={loadingAction}
      padding="px-6 py-4"
      scrollable={false}
      maxHeight=""
    >
      {children}
    </ModalBody>
  </BaseModal>
);

