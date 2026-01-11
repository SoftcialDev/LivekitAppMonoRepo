/**
 * @fileoverview Contact Manager Dashboard page
 * @summary Page for Contact Managers to view and update their status
 * @description Allows Contact Managers to view their current status and change it via dropdown
 */

import React, { useEffect, useState, useCallback } from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { useHeader } from '@/app/stores/header-store';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { Dropdown } from '@/ui-kit/dropdown';
import { Loading } from '@/ui-kit/feedback';
import { logError, logInfo } from '@/shared/utils/logger';
import { getMyContactManagerStatus, updateMyContactManagerStatus } from '../api/contactManagerDashboardClient';
import { STATUS_OPTIONS } from '../constants';
import { ManagerStatus } from '../enums';
import type { IDropdownOption } from '@/ui-kit/dropdown/types/dropdownTypes';

/**
 * Contact Manager Dashboard page component
 *
 * Displays the current user's Contact Manager status and allows them to change it.
 * - Shows current status
 * - Provides dropdown to change status
 * - Shows loading state during fetch/update
 * - Displays toast notifications for success/error
 *
 * @returns JSX element with Contact Manager Dashboard
 */
export const ContactManagerDashboardPage: React.FC = (): JSX.Element => {
  const { initialized } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<ManagerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Set header
  useHeader({
    title: 'Contact Manager',
    iconSrc: managementIcon,
    iconAlt: 'Contact Manager',
  });

  /**
   * Fetches the current user's Contact Manager status
   */
  const fetchStatus = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await getMyContactManagerStatus();
      setStatus(response.status);
      logInfo('Contact Manager status loaded', { status: response.status });
    } catch (err) {
      logError(err, { operation: 'fetchStatus' });
      showToast('Unable to load your status', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Effect to load status when component mounts
   */
  useEffect(() => {
    if (!initialized) return;
    fetchStatus();
  }, [initialized, fetchStatus]);

  /**
   * Handles status change when user selects a new status from dropdown
   *
   * @param value - Selected status value from dropdown
   */
  const handleStatusChange = useCallback(
    async (value: string | number): Promise<void> => {
      // Don't update if already saving
      if (isSaving) {
        return;
      }

      const newStatus = value as ManagerStatus;
      
      // Don't update if status hasn't changed
      if (newStatus === status) {
        return;
      }

      setIsSaving(true);
      try {
        const response = await updateMyContactManagerStatus(newStatus);
        setStatus(response.status);
        showToast('Status updated', 'success');
        logInfo('Contact Manager status updated', { status: response.status });
      } catch (err) {
        logError(err, { operation: 'updateStatus', status: newStatus });
        showToast('Failed to update status', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [status, isSaving, showToast]
  );

  // Convert status options to dropdown format
  const dropdownOptions: IDropdownOption[] = STATUS_OPTIONS.map((opt) => ({
    label: opt,
    value: opt,
  }));

  // Show loading spinner while fetching status
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-(--color-primary-dark) p-4">
        <Loading action="Loading your status" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-(--color-primary-dark) p-4">
      <div className="w-full max-w-sm bg-(--color-primary) rounded-lg shadow-md p-6">
        {/* Your Current Status Container */}
        <div className="text-white rounded-md p-4 mb-4">
          <label className="block font-medium mb-2">Your Current Status:</label>
          <div className="text-lg">{status || '—'}</div>
        </div>

        {/* Change Status Container with Dropdown */}
        <div className="text-white rounded-md p-4">
          <label className="block font-medium mb-2">Change Status:</label>
          <div className="relative">
            <Dropdown
              value={status || ''}
              onSelect={handleStatusChange}
              options={dropdownOptions}
              label="Select status"
              className="w-full"
              buttonClassName="w-full flex items-center justify-between px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg border border-[var(--color-primary-dark)] focus:ring-0 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              menuClassNameOverride="absolute left-0 mt-1 w-full bg-[var(--color-primary)] text-white border border-[var(--color-primary-dark)] rounded-lg shadow-lg z-50"
              menuBgClassName="bg-[var(--color-primary)] text-white"
            />
          </div>

          {/* Saving indicator */}
          {isSaving && (
            <div className="mt-4 text-sm text-white opacity-75">Saving…</div>
          )}
        </div>
      </div>
    </div>
  );
};

