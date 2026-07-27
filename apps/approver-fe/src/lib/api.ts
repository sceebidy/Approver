/**

 * Base URL for Laravel API requests from the browser.

 * Prefer the Next.js `/api` proxy so session cookies stay on the same origin.

 */

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "/api";
}


