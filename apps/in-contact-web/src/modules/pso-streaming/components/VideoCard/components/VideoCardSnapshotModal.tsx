/**
 * @fileoverview VideoCardSnapshotModal - Snapshot modal component for VideoCard
 * @summary Modal for capturing and submitting snapshot reports
 * @description Component that displays a modal for selecting snapshot reason,
 * entering description, and submitting snapshot reports.
 */

import React from 'react';
import { FormModal } from '@/ui-kit/modals';
import { Dropdown } from '@/ui-kit/dropdown';
import type { IVideoCardSnapshotModalProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardSnapshotModal component
 * 
 * Renders a modal for snapshot report submission with:
 * - Screenshot preview
 * - Reason dropdown (required)
 * - Description textarea (required if reason is "OTHER")
 * 
 * @param props - Component props
 * @returns React element rendering the snapshot modal
 */
export const VideoCardSnapshotModal: React.FC<IVideoCardSnapshotModalProps> = ({
  isModalOpen,
  email,
  screenshot,
  reason,
  description,
  snapshotReasons,
  isSubmitting,
  onClose,
  onConfirm,
  onReasonSelect,
  onDescriptionChange,
}) => {
  const isDescriptionRequired = reason?.code === 'OTHER';
  const submitDisabled = !reason || (isDescriptionRequired && !description.trim());

  return (
    <FormModal
      open={isModalOpen}
      title={<strong className="text-xl">Report</strong>}
      onClose={onClose}
      onSubmit={onConfirm}
      submitLabel="Send"
      loading={isSubmitting}
      className="w-[600px] max-w-[90vw]"
      loadingAction="Sending…"
      submitDisabled={submitDisabled}
    >
      <div className="space-y-4 text-white overflow-y-auto w-full mx-auto">
        <p><strong>PSO:</strong> {email}</p>
        
        {screenshot && (
          <img
            src={screenshot}
            alt="Snapshot preview"
            className="max-w-full w-fit h-auto object-contain rounded mx-auto"
          />
        )}
        
        <div>
          <div className="block mb-2 text-sm font-medium">
            <strong>Reason *</strong>
          </div>
          <div className="w-full">
            <Dropdown
              value={reason?.id || ''}
              onSelect={(value) => {
                const selectedReason = snapshotReasons.find(r => r.id === value);
                onReasonSelect(selectedReason || null);
              }}
              label="Select a reason"
              options={snapshotReasons.map(r => ({
                label: r.label,
                value: r.id,
              }))}
              className="w-full"
              buttonClassName="w-full flex items-center justify-between px-4 py-2 bg-(--color-tertiary) text-(--color-primary-dark) rounded-lg focus:ring-0 focus:border-transparent"
              menuClassNameOverride="absolute left-0 mt-1 bg-(--color-tertiary) text-(--color-primary-dark) border border-gray-200 rounded-lg shadow-lg z-50 divide-y divide-gray-100"
              menuStyle={{ width: '-webkit-fill-available', marginLeft: '24px', marginRight: '24px' }}
              menuBgClassName="bg-(--color-tertiary) text-(--color-primary-dark)"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            {isDescriptionRequired ? (
              <strong>Description * (mandatory)</strong>
            ) : (
              'Description (optional)'
            )}
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={isDescriptionRequired ? 'Enter description (required)' : 'Enter additional details (optional)'}
            className="w-full h-32 p-2 rounded border bg-(--color-tertiary) text-(--color-primary-dark) placeholder-(--color-primary-dark)/70 focus:outline-none focus:ring-0 focus:border-(--color-tertiary) border-(--color-tertiary) resize-none overflow-wrap wrap-break-word"
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          />
        </div>
      </div>
    </FormModal>
  );
};

