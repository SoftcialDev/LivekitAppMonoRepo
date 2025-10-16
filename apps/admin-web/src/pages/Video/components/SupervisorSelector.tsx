/**
 * @fileoverview SupervisorSelector - Dropdown component for changing supervisor assignment
 * @summary Allows changing supervisor assignment while preserving the existing visual style
 * @description Provides a dropdown interface that replaces only the supervisor part of the name display
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SearchableDropdown, DropdownOption } from '@/shared/ui/SearchableDropdown';
import { getUsersByRole, changeSupervisor, UserByRole, ChangeSupervisorPayload } from '@/shared/api/userClient';
import { useToast } from '@/shared/ui/ToastContext';

// Simple in-memory cache shared across all SupervisorSelector instances
let supervisorsCache: UserByRole[] | null = null;
let supervisorsPromise: Promise<UserByRole[]> | null = null;
let supervisorsCachedAt = 0;
const SUPERVISORS_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Props for SupervisorSelector component
 */
export interface SupervisorSelectorProps {
  /** PSO name (e.g., "shanty cerdasb") */
  psoName: string;
  /** Current supervisor email */
  currentSupervisorEmail: string;
  /** Current supervisor name */
  currentSupervisorName: string;
  /** PSO email whose supervisor we're changing */
  psoEmail: string;
  /** Callback when supervisor is changed */
  onSupervisorChange: (psoEmail: string, newSupervisorEmail: string) => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Minimum width for portal dropdown menu (px) when many cameras */
  portalMinWidthPx?: number;
}

/**
 * SupervisorSelector component
 * 
 * Displays: "PSO Name — Supervisor: [Dropdown]"
 * Where the supervisor part is a searchable dropdown.
 * 
 * @param props.psoName - The PSO's name (e.g., "shanty cerdasb")
 * @param props.currentSupervisorEmail - Current supervisor's email
 * @param props.currentSupervisorName - Current supervisor's name  
 * @param props.psoEmail - Email of the PSO whose supervisor we're changing
 * @param props.onSupervisorChange - Callback when supervisor is changed
 * @param props.disabled - Whether the dropdown is disabled
 * @param props.className - Additional CSS classes
 */
export const SupervisorSelector: React.FC<SupervisorSelectorProps> = ({
  psoName,
  currentSupervisorEmail,
  currentSupervisorName,
  psoEmail,
  onSupervisorChange,
  disabled = false,
  className = '',
  portalMinWidthPx
}) => {
  const [supervisors, setSupervisors] = useState<UserByRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Local selection to update UI immediately after change
  const [selectedEmail, setSelectedEmail] = useState<string | undefined>(currentSupervisorEmail || undefined);
  const [selectedName, setSelectedName] = useState<string | undefined>(currentSupervisorName || undefined);

  useEffect(() => {
    setSelectedEmail(currentSupervisorEmail || undefined);
    setSelectedName(currentSupervisorName || undefined);
  }, [currentSupervisorEmail, currentSupervisorName]);

  /**
   * Fetches the list of available supervisors
   */
  const loadSupervisors = useCallback(async () => {
    // Serve from cache when available and fresh
    const now = Date.now();
    if (supervisorsCache && now - supervisorsCachedAt < SUPERVISORS_TTL_MS) {
      setSupervisors(supervisorsCache);
      return;
    }

    // Deduplicate concurrent requests across instances
    if (!supervisorsPromise) {
      supervisorsPromise = (async () => {
        const response = await getUsersByRole('Supervisor');
        supervisorsCache = response.users;
        supervisorsCachedAt = Date.now();
        return response.users;
      })();
    }

    setLoading(true);
    setError(null);
    try {
      const users = await supervisorsPromise;
      setSupervisors(users);
    } catch (err) {
      setError('Failed to load supervisors');
      console.error('Error fetching supervisors:', err);
    } finally {
      setLoading(false);
      supervisorsPromise = null; // allow refresh after completion
    }
  }, []);

  /**
   * Handles supervisor selection change
   */
  const handleSupervisorChange = useCallback(async (selectedEmails: string[]) => {
    // For single selection, we only care about the last selected item
    if (selectedEmails.length === 0) {
      return;
    }
    
    // Get the most recently selected supervisor (last in array)
    const newSupervisorEmail = selectedEmails[selectedEmails.length - 1];
    
    if (newSupervisorEmail !== currentSupervisorEmail) {
      try {
        const payload: ChangeSupervisorPayload = {
          userEmails: [psoEmail],
          newSupervisorEmail
        };
        
        await changeSupervisor(payload);
        // Optimistic UI update
        setSelectedEmail(newSupervisorEmail);
        const sup = supervisors.find(s => s.email === newSupervisorEmail);
        setSelectedName(sup ? `${sup.firstName} ${sup.lastName}` : undefined);
        onSupervisorChange(psoEmail, newSupervisorEmail);
        showToast('Supervisor updated', 'success');
      } catch (error) {
        console.error('Error changing supervisor assignment:', error);
        setError('Failed to change supervisor assignment');
        showToast('Failed to change supervisor', 'error');
      }
    }
  }, [currentSupervisorEmail, psoEmail, onSupervisorChange, supervisors, showToast]);

  /**
   * Load supervisors on mount
   */
  useEffect(() => {
    void loadSupervisors();
  }, []);

  // Convert supervisors to dropdown options
  const supervisorOptions: DropdownOption<string>[] = supervisors.map(supervisor => ({
    label: `${supervisor.firstName} ${supervisor.lastName}`,
    value: supervisor.email
  }));

  // Current supervisor as selected value
  const selectedValues = selectedEmail ? [selectedEmail] : [];

  // Debug logs
  console.log('SupervisorSelector Debug:', {
    supervisors: supervisors.length,
    supervisorOptions: supervisorOptions.length,
    currentSupervisorEmail,
    loading
  });

  if (error) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        {psoName} — Supervisor: Error loading supervisors
      </div>
    );
  }

  return (
    <div className={`flex items-center text-white truncate ${className}`}>
      {/* Green status dot */}
      <span className="inline-block w-3 h-3 rounded-full bg-[var(--color-secondary)] mr-2"></span>
      <span className="text-white truncate text-base leading-6">
        {psoName} — Supervisor: 
      </span>
      <div className="ml-2 flex-1 min-w-0 relative">
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
            absolute left-0 top-full mt-1 w-full max-h-48 overflow-auto custom-scrollbar
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
        />
      </div>
    </div>
  );
};

export default SupervisorSelector;
