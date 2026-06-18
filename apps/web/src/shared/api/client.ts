/**
 * Base API client.
 * VITE_API_URL can override the local FastAPI URL in deployed environments.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ApiError = {
  message: string;
  status: number;
};

export async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const error: ApiError = {
      message: payload?.detail ?? `API error: ${res.status} ${res.statusText}`,
      status: res.status,
    };
    throw error;
  }

  return res.json() as Promise<T>;
}
