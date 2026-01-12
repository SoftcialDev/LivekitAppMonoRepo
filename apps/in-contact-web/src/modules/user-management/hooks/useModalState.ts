/**
 * @fileoverview useModalState Hook
 * @summary Hook for managing modal open/close state
 * @description Provides state and handlers for modal visibility
 */

import { useState, useCallback } from 'react';
import type { UseModalStateReturn } from './types/useModalStateTypes';

/**
 * Hook for managing modal open/close state
 *
 * Provides state and handlers for controlling modal visibility.
 * Handles opening, closing, and resetting modal state.
 *
 * @returns Hook return value with modal state and handlers
 *
 * @example
 * ```typescript
 * const { isModalOpen, handleOpenModal, handleCloseModal } = useModalState();
 * ```
 */
export function useModalState(): UseModalStateReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback((): void => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setIsModalOpen(false);
  }, []);

  return {
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
  };
}

