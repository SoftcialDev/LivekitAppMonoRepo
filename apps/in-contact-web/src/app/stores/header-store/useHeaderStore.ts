/**
 * @fileoverview HeaderStore - Zustand store for managing header information
 * @summary Global state management for header title and icon
 * @description Zustand store for managing header information across the application.
 * Pages can use the useHeader hook to set their header dynamically.
 */

import { create } from 'zustand';
import type { IHeaderState } from './types';
import { DEFAULT_HEADER } from './constants';

/**
 * Zustand store for header state management
 * 
 * Provides:
 * - Current header info (title, iconSrc, iconAlt, iconNode)
 * - setHeader method to update header
 * - resetHeader method to reset to default
 */
export const useHeaderStore = create<IHeaderState>((set) => ({
  header: DEFAULT_HEADER,
  setHeader: (info) => set({ header: info }),
  resetHeader: () => set({ header: DEFAULT_HEADER }),
}));

