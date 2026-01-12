/**
 * @fileoverview BaseModal - Base draggable modal component with portal rendering
 * @summary Core modal component with dragging, positioning, and composition support
 * @description Provides foundation for all modal components with draggable functionality,
 * portal rendering, and flexible content composition via header, body, and footer slots.
 * 
 * Features:
 * - Draggable by header (configurable)
 * - Portal rendering to document.body
 * - Auto-centering on open
 * - Customizable styling via className or classNameOverride
 * - Custom header/footer support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { IBaseModalProps } from './types';

/**
 * BaseModal component
 * 
 * Core modal component that provides:
 * 1. Draggable functionality (grab header to drag)
 * 2. Portal rendering (renders outside React tree)
 * 3. Auto-centering on open
 * 4. Flexible content composition
 * 
 * Use this component directly for full control, or use specialized modals
 * (ConfirmModal, DetailsModal, FormModal, PreviewModal) for common patterns.
 * 
 * @param props - Component props
 * @returns Portal-rendered modal or null if not open
 */
export const BaseModal: React.FC<IBaseModalProps> = ({
  open,
  children,
  onClose,
  className = '',
  classNameOverride,
  draggable = true,
  customHeader,
  customFooter,
  zIndex = 9999,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  /**
   * Centers the modal on first open by measuring its dimensions and the viewport
   */
  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    if (!modal) return;
    const { offsetWidth: w, offsetHeight: h } = modal;
    setPos({
      x: globalThis.window.innerWidth / 2 - w / 2,
      y: globalThis.window.innerHeight / 2 - h / 2,
    });
  }, [open]);

  /**
   * Starts dragging by capturing the mouse offset relative to the modal
   * 
   * @param e - Mouse event
   */
  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    if (!draggable || e.button !== 0) return; // only left-click and if draggable
    const modal = modalRef.current;
    if (!modal) return;
    const rect = modal.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
    e.preventDefault();
  }, [draggable]);

  /**
   * Updates modal position while dragging using the stored offset
   * 
   * @param e - Mouse move event
   */
  const handleMouseMove = useCallback((e: MouseEvent): void => {
    if (!dragging || !offset) return;
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [dragging, offset]);

  /**
   * Ends the drag operation and clears the offset
   */
  const handleMouseUp = useCallback((): void => {
    setDragging(false);
    setOffset(null);
  }, []);

  /**
   * Global listeners for drag move/up to allow dragging outside the modal bounds
   */
  useEffect(() => {
    if (!draggable) return;
    
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, draggable, handleMouseMove, handleMouseUp]);

  // Default container classes (preserved unless fully overridden)
  const defaultContainer = `
    absolute
    bg-[var(--color-primary-light)]
    border-2 border-white
    rounded-lg shadow-xl
    w-[90%]
  `.replaceAll(/\s+/g, ' ').trim();

  // Final container class calculation:
  // - If classNameOverride is provided, use that exactly
  // - Else use defaults + optional className append
  const containerClass =
    classNameOverride?.trim() || `${defaultContainer} ${className || ''}`.trim();

  // Handle Escape key to close modal
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-9999" 
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Close on overlay click (optional - can be removed if not desired)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={containerClass}
        style={classNameOverride ? {} : { left: pos.x, top: pos.y }}
      >
        {(() => {
          if (!customHeader) {
            return null;
          }
          if (draggable) {
            return (
              <button
                type="button"
                aria-label="Drag to move modal"
                onMouseDown={handleMouseDown}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                className="w-full cursor-move"
              >
                {customHeader}
              </button>
            );
          }
          return <div>{customHeader}</div>;
        })()}
        {children}
        {customFooter}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

