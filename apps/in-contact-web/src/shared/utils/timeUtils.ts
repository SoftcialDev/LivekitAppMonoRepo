/**
 * @fileoverview Time formatting utilities
 * @summary Common time formatting functions
 * @description Reusable utilities for formatting relative time (time ago)
 */

/**
 * Formats a timestamp as relative time (e.g., "5 minutes ago", "2 hours ago")
 * 
 * @param isoString - ISO-8601 timestamp string to format
 * @returns Formatted relative time string, or empty string if invalid
 */
export function formatTimeAgo(isoString: string | null | undefined): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
}

