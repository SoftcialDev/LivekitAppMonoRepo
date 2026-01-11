/**
 * @fileoverview TalkNavigationModal component
 * @summary Modal for confirming navigation during active talk session
 * @description Displays a confirmation modal when user attempts to navigate
 * during an active talk session, warning them that they will lose the call
 */

import React from 'react';
import { ConfirmModal } from '@/ui-kit/modals';
import type { ITalkNavigationModalProps } from './types/talkNavigationModalTypes';

/**
 * TalkNavigationModal component
 * 
 * Displays a confirmation modal when user attempts to navigate during
 * an active talk session. Warns user that they will lose the call if
 * they proceed with navigation.
 * 
 * @param props - Component props
 * @returns JSX element with confirmation modal
 */
export const TalkNavigationModal: React.FC<ITalkNavigationModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  return (
    <ConfirmModal
      open={open}
      title="Active Talk Session"
      message="You have an active talk session. If you leave this page, you will lose the call. Do you want to continue?"
      onConfirm={onConfirm}
      onClose={onCancel}
      confirmLabel="Yes, Leave Page"
      cancelLabel="Stay on Page"
    />
  );
};


