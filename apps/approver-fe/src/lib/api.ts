/**
 * Base URL for Laravel API requests from the browser.
 * Prefer the Next.js `/api` proxy so session cookies stay on the same origin.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
}
