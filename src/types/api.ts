/**
 * Shared type definitions for API responses
 */

/**
 * Standard error payload returned by the backend
 * when an API request fails.
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
}
