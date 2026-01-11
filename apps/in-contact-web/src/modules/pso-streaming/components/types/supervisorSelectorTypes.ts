/**
 * @fileoverview SupervisorSelector component types
 * @summary Type definitions for SupervisorSelector component
 * @description Interfaces for SupervisorSelector component props
 */

/**
 * Props for SupervisorSelector component
 */
export interface ISupervisorSelectorProps {
  psoName: string;
  currentSupervisorEmail: string;
  currentSupervisorName: string;
  psoEmail: string;
  onSupervisorChange: (psoEmail: string, newSupervisorEmail: string) => void;
  disabled?: boolean;
  className?: string;
  portalMinWidthPx?: number;
}

