/**
 * @fileoverview Modals barrel export
 * @summary Re-exports all modal components and types
 */

// Base modal
export { BaseModal } from './BaseModal';

// Specialized modals
export { ConfirmModal } from './ConfirmModal';
export { DetailsModal } from './DetailsModal';
export { FormModal } from './FormModal';
export { PreviewModal } from './PreviewModal';

// Composition components
export { ModalHeader, ModalBody, ModalFooter } from './components';

// Types
export type {
  IBaseModalProps,
  IModalHeaderProps,
  IModalBodyProps,
  IModalFooterProps,
  IConfirmModalProps,
  IDetailsModalProps,
  IFormModalProps,
  IPreviewModalProps,
} from './types';

