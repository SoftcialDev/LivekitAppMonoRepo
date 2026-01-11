/**
 * @fileoverview VideoCard component types
 * @summary Type definitions for VideoCard components
 * @description Type definitions for SimpleVideoCard and VideoCard components
 */

import type { TimerInfo } from '../../types';
import type { StreamingStopReason } from '../../enums/streamingStopReason';

/**
 * Props for SimpleVideoCard component
 */
export interface ISimpleVideoCardProps {
  email: string;
  name: string;
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  shouldStream: boolean;
  connecting: boolean;
  disableControls: boolean;
  className?: string;
  statusMessage?: string;
  psoName?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  onSupervisorChange?: (psoEmail: string, newSupervisorEmail: string) => void;
  portalMinWidthPx?: number;
  stopReason?: StreamingStopReason | string | null;
  stoppedAt?: string | null;
  timerInfo?: TimerInfo | null;
}

/**
 * Props for VideoCard component (full featured)
 */
export interface IVideoCardProps {
  name: string;
  email: string;
  onPlay?: (email: string) => void;
  onChat: (email: string) => void;
  showHeader?: boolean;
  className?: string;
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  shouldStream?: boolean;
  connecting?: boolean;
  onToggle?: (email: string, reason?: StreamingStopReason | string) => void;
  disableControls?: boolean;
  statusMessage?: string;
  psoName?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  onSupervisorChange?: (psoEmail: string, newSupervisorEmail: string) => void;
  portalMinWidthPx?: number;
  stopReason?: StreamingStopReason | string | null;
  stoppedAt?: string | null;
}
