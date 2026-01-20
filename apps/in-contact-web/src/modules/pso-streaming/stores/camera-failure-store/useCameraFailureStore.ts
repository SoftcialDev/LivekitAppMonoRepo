/**
 * @fileoverview Camera Failure Store
 * @summary Zustand store for camera failure errors
 * @description Stores camera failure error messages by PSO email for display in video cards
 */

import { create } from 'zustand';
import type { ICameraFailureStoreState } from './types/cameraFailureStoreTypes';

/**
 * Zustand store for camera failure errors
 * 
 * Stores error messages by PSO email so they can be displayed
 * in the video card while connecting.
 */
export const useCameraFailureStore = create<ICameraFailureStoreState>((set, get) => ({
  errors: new Map<string, string>(),

  setError: (psoEmail: string, errorMessage: string) => {
    set((state) => {
      const newErrors = new Map(state.errors);
      newErrors.set(psoEmail.toLowerCase(), errorMessage);
      return { errors: newErrors };
    });
  },

  clearError: (psoEmail: string) => {
    set((state) => {
      const newErrors = new Map(state.errors);
      newErrors.delete(psoEmail.toLowerCase());
      return { errors: newErrors };
    });
  },

  getError: (psoEmail: string) => {
    return get().errors.get(psoEmail.toLowerCase());
  },
}));

