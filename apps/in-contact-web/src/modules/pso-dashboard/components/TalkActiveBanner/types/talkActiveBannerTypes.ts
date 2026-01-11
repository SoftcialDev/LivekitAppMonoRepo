/**
 * @fileoverview Types for TalkActiveBanner component
 * @summary Type definitions for talk active banner
 */

/**
 * Props for the TalkActiveBanner component
 */
export interface ITalkActiveBannerProps {
  /**
   * Whether the talk session is currently active
   */
  isActive: boolean;
  /**
   * Whether the call is in the incoming phase (first 3 seconds)
   */
  isIncoming: boolean;
  /**
   * Whether the call just ended (showing hang up message)
   */
  justEnded: boolean;
  /**
   * Name of the supervisor in the active talk session
   */
  supervisorName: string;
}

