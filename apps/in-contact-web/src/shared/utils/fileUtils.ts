/**
 * @fileoverview File utilities
 * @summary Common file operations utilities
 * @description Reusable utilities for file downloads, filename generation, and file operations
 */

/**
 * Sanitizes a string for use in file names
 * 
 * Removes special characters, replaces spaces with underscores, and limits length.
 * Used to create safe file names from user input or API data.
 * 
 * @param str - String to sanitize
 * @param maxLen - Maximum length of the sanitized string
 * @returns Sanitized string safe for use in file names
 * 
 * @example
 * ```typescript
 * sanitizeFileName('User Name Here!', 20) // "User_Name_Here"
 * sanitizeFileName('test@example.com', 10) // "testexample"
 * ```
 */
export function sanitizeFileName(str: string, maxLen: number = 50): string {
  if (!str) return 'unknown';
  let sanitized = str.trim().replaceAll(/\s+/g, '_').replaceAll(/[^a-zA-Z0-9._-]/g, '');
  sanitized = sanitized.replaceAll(/_+/g, '_');
  // Split into two replace calls to avoid alternation and ensure safe execution
  sanitized = sanitized.replaceAll(/^[._-]+/g, '');
  sanitized = sanitized.replaceAll(/[._-]+$/g, '');
  if (sanitized.length > maxLen) {
    sanitized = sanitized.substring(0, maxLen).replace(/[._-]+$/, '');
  }
  return sanitized || 'unknown';
}

/**
 * Downloads a remote file URL to the user's machine
 * 
 * Fetches the file from the URL, creates a blob, and triggers a download
 * with the specified file name. Handles CORS and errors gracefully.
 * 
 * @param url - Remote file URL to download
 * @param fileName - Name for the downloaded file
 * @returns Promise that resolves when download completes or rejects on error
 * @throws {Error} If the fetch fails or file cannot be downloaded
 * 
 * @example
 * ```typescript
 * await downloadFile('https://example.com/image.jpg', 'my-image.jpg');
 * ```
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  // 1) Fetch the file as a blob
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch file`);
  }
  const blob = await res.blob();

  // 2) Create an object URL for the blob
  const blobUrl = URL.createObjectURL(blob);

  // 3) Create a temporary <a> with download attribute
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);

  // 4) Trigger the download
  a.click();

  // 5) Clean up
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

