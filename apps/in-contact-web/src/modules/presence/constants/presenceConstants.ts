/**
 * @fileoverview Presence constants
 * @summary Constants for presence module configuration
 * @description Centralized constants for presence API and store operations
 */

/**
 * Page size for paginated presence requests to the API
 * 
 * This is the chunk size we request from the backend per page.
 * Used when paginating through presence data.
 */
export const PRESENCE_PAGE_SIZE = 50;

/**
 * Maximum number of users to fetch initially for performance reasons
 * 
 * Beyond this limit, we recommend:
 * - Using server-side search/filtering
 * - Implementing lazy loading for offline users
 * - Using virtual scrolling for large lists
 * 
 * Can be adjusted based on:
 * - Typical number of concurrent users in your system
 * - Network bandwidth
 * - Client device capabilities
 * 
 * @constant
 * @default 1000
 */
export const PRESENCE_MAX_INITIAL_USERS = 1000;

