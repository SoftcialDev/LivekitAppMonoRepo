/**
 * @fileoverview Modal component type definitions
 * @summary Type definitions for modal components
 * @description Defines interfaces and types for base modal and specialized modal components
 */

import type React from 'react';

/**
 * Props for BaseModal component
 * 
 * Base configuration for draggable modal dialog with portal rendering.
 * Provides core functionality: dragging, positioning, loading overlay, and customizable content.
 */
export interface IBaseModalProps {
  /**
   * Whether the modal is visible
   */
  open: boolean;

  /**
   * Content to render inside the modal body
   */
  children: React.ReactNode;

  /**
   * Callback invoked when the modal is requested to close
   */
  onClose: () => void;

  /**
   * Additional CSS class names appended to the default container classes
   * 
   * Ignored if `classNameOverride` is provided.
   */
  className?: string;

  /**
   * If provided, completely replaces the container classes
   * 
   * Use this to fully override the default styling/layout.
   * When set, `className` is ignored.
   */
  classNameOverride?: string;

  /**
   * Whether the modal is draggable by the header
   * 
   * @default true
   */
  draggable?: boolean;

  /**
   * Custom header content
   * 
   * If provided, replaces the default header. Useful for custom headers
   * that don't follow the standard pattern.
   */
  customHeader?: React.ReactNode;

  /**
   * Custom footer content
   * 
   * If provided, replaces the default footer. If not provided and footer
   * is needed, use specialized modal components like ConfirmModal or FormModal.
   */
  customFooter?: React.ReactNode;

  /**
   * Z-index for the modal overlay
   * 
   * @default 9999
   */
  zIndex?: number;
}

/**
 * Props for ModalHeader component
 */
export interface IModalHeaderProps {
  /**
   * Text or React node to display in the header
   */
  title: string | React.ReactNode;

  /**
   * URL or import for the header icon
   */
  iconSrc?: string;

  /**
   * Alternative text for the header icon
   */
  iconAlt?: string;

  /**
   * Callback invoked when the close button is clicked
   */
  onClose: () => void;

  /**
   * Additional actions to render on the right side of the header
   * 
   * Typically used for action buttons like "Copy", "Save", etc.
   */
  actions?: React.ReactNode;

  /**
   * Whether the header is draggable (cursor-move style)
   * 
   * @default true
   */
  draggable?: boolean;

  /**
   * Mouse down handler for dragging (provided by BaseModal)
   */
  onMouseDown?: (e: React.MouseEvent) => void;
}

/**
 * Props for ModalBody component
 */
export interface IModalBodyProps {
  /**
   * Content to render inside the body
   */
  children: React.ReactNode;

  /**
   * Show loading overlay in the body area
   * 
   * @default false
   */
  loading?: boolean;

  /**
   * Text to display under the spinner when loading
   * 
   * @default "Loading…"
   */
  loadingAction?: string;

  /**
   * Custom padding class
   * 
   * @default "px-6 py-2"
   */
  padding?: string;

  /**
   * Custom text color class
   * 
   * @default "text-white"
   */
  textColor?: string;

  /**
   * Enable vertical scrolling for long content
   * 
   * @default true
   */
  scrollable?: boolean;

  /**
   * Maximum height for scrollable content
   * 
   * @default "max-h-[60vh]"
   */
  maxHeight?: string;
}

/**
 * Props for ModalFooter component
 */
export interface IModalFooterProps {
  /**
   * Callback invoked when the cancel button is clicked
   * Required only if cancelLabel is provided
   */
  onCancel?: () => void;

  /**
   * Callback invoked when the confirm/primary button is clicked
   */
  onConfirm: () => void;

  /**
   * Label for the confirm/primary button
   * 
   * @default "Confirm"
   */
  confirmLabel?: string;

  /**
   * Label for the cancel button
   * 
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Whether the confirm button is disabled
   * 
   * @default false
   */
  confirmDisabled?: boolean;

  /**
   * Whether the cancel button is disabled
   * 
   * @default false
   */
  cancelDisabled?: boolean;

  /**
   * Additional content to render between cancel and confirm buttons
   */
  children?: React.ReactNode;
}

/**
 * Props for ConfirmModal component
 * 
 * Specialized modal for simple confirmation dialogs (e.g., delete confirmations).
 */
export interface IConfirmModalProps {
  /**
   * Whether the modal is visible
   */
  open: boolean;

  /**
   * Title text or React node for the modal header
   */
  title: string | React.ReactNode;

  /**
   * Icon source URL for the header (optional)
   */
  iconSrc?: string;

  /**
   * Alternative text for the header icon
   */
  iconAlt?: string;

  /**
   * Message content to display in the modal body
   */
  message: string | React.ReactNode;

  /**
   * Callback invoked when the modal is closed (cancel or close button)
   */
  onClose: () => void;

  /**
   * Callback invoked when the confirm action is triggered
   */
  onConfirm: () => void;

  /**
   * Label for the confirm button
   * 
   * @default "Confirm"
   */
  confirmLabel?: string;

  /**
   * Label for the cancel button
   * 
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Whether the confirm button is disabled
   * 
   * @default false
   */
  confirmDisabled?: boolean;

  /**
   * Additional CSS classes for the modal container
   */
  className?: string;
}

/**
 * Props for DetailsModal component
 * 
 * Specialized modal for displaying detailed information (read-only view).
 * Typically used for entity details, error logs, etc.
 */
export interface IDetailsModalProps {
  /**
   * Whether the modal is visible
   */
  open: boolean;

  /**
   * Title text or React node for the modal header
   */
  title: string | React.ReactNode;

  /**
   * Icon source URL for the header (optional)
   */
  iconSrc?: string;

  /**
   * Alternative text for the header icon
   */
  iconAlt?: string;

  /**
   * Content to render inside the modal body
   * 
   * Typically a details view with formatted information.
   */
  children: React.ReactNode;

  /**
   * Callback invoked when the modal is closed
   */
  onClose: () => void;

  /**
   * Additional actions to render in the header (e.g., "Copy" button)
   */
  headerActions?: React.ReactNode;

  /**
   * Maximum width for the modal
   * 
   * @default "max-w-4xl"
   */
  maxWidth?: string;

  /**
   * Additional CSS classes for the modal container
   */
  className?: string;
}

/**
 * Props for FormModal component
 * 
 * Specialized modal for forms with loading state during submission.
 */
export interface IFormModalProps {
  /**
   * Whether the modal is visible
   */
  open: boolean;

  /**
   * Title text or React node for the modal header
   */
  title: string | React.ReactNode;

  /**
   * Icon source URL for the header (optional)
   */
  iconSrc?: string;

  /**
   * Alternative text for the header icon
   */
  iconAlt?: string;

  /**
   * Form content to render inside the modal body
   */
  children: React.ReactNode;

  /**
   * Callback invoked when the modal is closed (cancel button)
   */
  onClose: () => void;

  /**
   * Callback invoked when the form is submitted (confirm button)
   */
  onSubmit: () => void;

  /**
   * Label for the submit button
   * 
   * @default "Submit"
   */
  submitLabel?: string;

  /**
   * Label for the cancel button
   * 
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Show loading overlay in the body area
   * 
   * @default false
   */
  loading?: boolean;

  /**
   * Text to display under the spinner when loading
   * 
   * @default "Submitting…"
   */
  loadingAction?: string;

  /**
   * Whether the submit button is disabled
   * 
   * @default false
   */
  submitDisabled?: boolean;

  /**
   * Maximum width for the modal
   * 
   * @default "w-[600px] max-w-[90vw]"
   */
  maxWidth?: string;

  /**
   * Additional CSS classes for the modal container
   */
  className?: string;
}

/**
 * Props for PreviewModal component
 * 
 * Specialized modal for previewing content (images, videos, etc.) without footer.
 */
export interface IPreviewModalProps {
  /**
   * Whether the modal is visible
   */
  open: boolean;

  /**
   * Title text or React node for the modal header
   */
  title: string | React.ReactNode;

  /**
   * Icon source URL for the header (optional)
   */
  iconSrc?: string;

  /**
   * Alternative text for the header icon
   */
  iconAlt?: string;

  /**
   * Content to preview (typically an image or video)
   */
  children: React.ReactNode;

  /**
   * Callback invoked when the modal is closed
   */
  onClose: () => void;

  /**
   * Maximum width for the preview modal
   * 
   * @default "w-[90vw] max-w-6xl"
   */
  maxWidth?: string;

  /**
   * Additional CSS classes for the modal container
   */
  className?: string;
}

