/**
 * @fileoverview SupervisorSelector component
 * @summary Dropdown component for changing supervisor assignment
 * @description Provides a dropdown interface that replaces only the supervisor part of the name display
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchableDropdown } from '@/ui-kit/dropdown';
import { changeSupervisor } from '@/modules/user-management/api/supervisorClient';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import type { ISupervisorSelectorProps } from './types/supervisorSelectorTypes';
import { useSupervisorsStore } from '../stores/supervisors-store';

/**
 * SupervisorSelector component
 * 
 * Displays: "PSO Name — Supervisor: [Dropdown]"
 * Where the supervisor part is a searchable dropdown.
 */
export const SupervisorSelector: React.FC<ISupervisorSelectorProps> = ({
  psoName,
  currentSupervisorEmail,
  currentSupervisorName,
  psoEmail,
  onSupervisorChange,
  disabled = false,
  className = '',
  portalMinWidthPx,
}) => {
  const supervisors = useSupervisorsStore((state) => state.supervisors);
  const supLoading = useSupervisorsStore((state) => state.loading);
  const supError = useSupervisorsStore((state) => state.error);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [selectedEmail, setSelectedEmail] = useState<string | undefined>(currentSupervisorEmail || undefined);
  const [selectedName, setSelectedName] = useState<string | undefined>(currentSupervisorName || undefined);

  useEffect(() => {
    setSelectedEmail(currentSupervisorEmail || undefined);
    setSelectedName(currentSupervisorName || undefined);
  }, [currentSupervisorEmail, currentSupervisorName]);

  // Supervisors are loaded once at page level (PSOsStreamingPage)
  // No need to load here - just use the shared store data

  // Refetch supervisors when a supervisorChange WS event arrives (dispatched by supervisor store)
  useEffect(() => {
    const refetch = () => {
      const loadSupervisorsFromStore = useSupervisorsStore.getState().loadSupervisors;
      void loadSupervisorsFromStore(true);
    };

    window.addEventListener('supervisorChange', refetch);
    window.addEventListener('supervisorListChanged', refetch);
    return () => {
      window.removeEventListener('supervisorChange', refetch);
      window.removeEventListener('supervisorListChanged', refetch);
    };
    // No dependencies - refetch function is stable and event listeners don't need to re-register
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSupervisorChange = useCallback(async (selectedEmails: string[]): Promise<void> => {
    if (selectedEmails.length === 0) {
      return;
    }
    
    const newSupervisorEmail = selectedEmails[selectedEmails.length - 1];
    
    if (newSupervisorEmail !== currentSupervisorEmail) {
      try {
        await changeSupervisor({
          userEmails: [psoEmail],
          newSupervisorEmail,
        });
        
        setSelectedEmail(newSupervisorEmail);
        const sup = supervisors.find(s => s.email === newSupervisorEmail);
        setSelectedName(sup ? `${sup.firstName} ${sup.lastName}` : undefined);
        onSupervisorChange(psoEmail, newSupervisorEmail);
        showToast('Supervisor updated', 'success');
      } catch (err) {
        logError('Error changing supervisor assignment', { error: err });
        setError('Failed to change supervisor assignment');
        showToast('Failed to change supervisor', 'error');
      }
    }
  }, [currentSupervisorEmail, psoEmail, onSupervisorChange, supervisors, showToast]);

  const supervisorOptions = useMemo(
    () =>
      supervisors.map((supervisor) => ({
        label: `${supervisor.firstName} ${supervisor.lastName}`,
        value: supervisor.email,
      })),
    [supervisors]
  );

  const selectedValues = selectedEmail ? [selectedEmail] : [];

  const effectiveError = error || supError;

  if (effectiveError) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        {psoName} — Supervisor: Error loading supervisors
      </div>
    );
  }

  return (
    <div className={`flex items-center text-white truncate ${className}`}>
      <span className="inline-block w-3 h-3 rounded-full bg-(--color-secondary) mr-2"></span>
      <span className="text-white truncate text-base leading-6">
        {psoName} — Supervisor: 
      </span>
      <div className={`ml-2 flex-1 min-w-0 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <SearchableDropdown
          options={supervisorOptions}
          selectedValues={selectedValues}
          onSelectionChange={handleSupervisorChange}
          placeholder={selectedName || currentSupervisorName || 'Select supervisor'}
          className="w-full"
          inputClassName="
            w-full px-2 py-1
            bg-transparent border-0 rounded
            text-white font-normal text-base
            placeholder-gray-300 placeholder-opacity-75
            focus:outline-none focus:bg-[var(--color-primary-dark)]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          menuClassName="
            absolute left-0 top-full mt-1 w-full
            bg-[var(--color-primary-dark)] border border-[var(--color-secondary)] rounded shadow-lg
            text-white font-normal text-base
          "
          itemClassName="
            flex items-center px-3 py-2
            text-white font-normal text-base
            hover:bg-[var(--color-primary)] cursor-pointer
            border-b border-[var(--color-primary)] last:border-b-0
          "
          usePortal={true}
          portalMinWidthPx={portalMinWidthPx}
          isLoading={supLoading}
        />
      </div>
    </div>
  );
};

export default SupervisorSelector;

