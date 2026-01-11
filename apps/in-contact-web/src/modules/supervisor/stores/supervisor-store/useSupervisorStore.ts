/**
 * @fileoverview Supervisor store - Zustand store for supervisor operations
 * @summary Manages supervisor change notifications and state
 * @description Store for handling supervisor-related WebSocket notifications
 * 
 * This store handles all supervisor-related logic, following Single Responsibility Principle.
 * It delegates presence updates to the presence store via updateSupervisorInfo().
 */

import { create } from 'zustand';
import { usePresenceStore } from '@/modules/presence/stores/presence-store';
import { UserRole } from '@/modules/auth/enums';
import { logInfo, logDebug } from '@/shared/utils/logger';
import { ROLES_ALWAYS_REFRESH } from './constants/supervisorConstants';
import type { ISupervisorState } from './types/supervisorStoreTypes';
import type { ISupervisorChangeData } from '../../types/supervisorTypes';

export const useSupervisorStore = create<ISupervisorState>((set, get) => ({
  lastSupervisorChange: null,
  lastSupervisorListChange: null,

  /**
   * Handles supervisor change notification
   * 
   * Determines if the current user should refresh their data and
   * updates the presence store with new supervisor information.
   */
  handleSupervisorChange: (data: ISupervisorChangeData): void => {
    logInfo('Handling supervisor change notification', {
      psoCount: data.psoEmails.length,
      newSupervisor: data.newSupervisorEmail,
    });

    // Update presence store with new supervisor info
    usePresenceStore.getState().updateSupervisorInfo({
      psoEmails: data.psoEmails,
      newSupervisorEmail: data.newSupervisorEmail,
      newSupervisorId: data.newSupervisorId,
      newSupervisorName: data.newSupervisorName,
    });

    // Dispatch CustomEvent for components that listen to it (e.g., SupervisorSelector)
    const event = new CustomEvent('supervisorChange', {
      detail: {
        psoEmails: data.psoEmails,
        oldSupervisorEmail: data.oldSupervisorEmail,
        newSupervisorEmail: data.newSupervisorEmail,
        newSupervisorId: data.newSupervisorId,
        newSupervisorName: data.newSupervisorName,
      },
    });
    window.dispatchEvent(event);

    // Notify subscribers via Zustand
    get().notifySupervisorChange(data);
  },

  /**
   * Handles supervisor list changed notification
   */
  handleSupervisorListChanged: (data: unknown): void => {
    logInfo('Handling supervisor list changed notification', {});
    
    // Dispatch CustomEvent for components that listen to it
    const event = new CustomEvent('supervisorListChanged', { detail: data });
    window.dispatchEvent(event);
    
    get().notifySupervisorListChanged(data);
  },

  /**
   * Notifies subscribers of supervisor change
   * 
   * Updates state to trigger re-renders in subscribed components.
   */
  notifySupervisorChange: (data: ISupervisorChangeData): void => {
    set({ lastSupervisorChange: data });
  },

  /**
   * Notifies subscribers of supervisor list change
   */
  notifySupervisorListChanged: (data: unknown): void => {
    set({ lastSupervisorListChange: data });
  },

  /**
   * Determines if the current user should refresh data based on supervisor change
   */
  shouldRefreshForUser: (
    data: ISupervisorChangeData,
    currentEmail: string,
    currentRole?: UserRole | string | null
  ): boolean => {
    const lowerPsoEmails = data.psoEmails.map((e) => e.toLowerCase());
    const email = currentEmail.toLowerCase();

    // Check if user is an affected PSO
    const isAffectedPso = lowerPsoEmails.includes(email);

    // Check if user is the old or new supervisor
    const isOldSupervisor =
      data.oldSupervisorEmail &&
      email === data.oldSupervisorEmail.toLowerCase();
    const isNewSupervisor = email === data.newSupervisorEmail.toLowerCase();

    // Always refresh for Admin/SuperAdmin/Supervisor roles
    const shouldRefreshByRole =
      currentRole &&
      (typeof currentRole === 'string'
        ? ROLES_ALWAYS_REFRESH.includes(currentRole as UserRole)
        : ROLES_ALWAYS_REFRESH.includes(currentRole));

    return (
      shouldRefreshByRole ||
      isAffectedPso ||
      isOldSupervisor ||
      isNewSupervisor
    );
  },
}));

