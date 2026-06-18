/**
 * Base API client.
 * When the FastAPI backend is ready, set VITE_API_URL in .env
 * and this client will forward all requests to the real API.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

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

  const res = await fetch(url.toString());

  if (!res.ok) {
    const error: ApiError = {
      message: `API error: ${res.status} ${res.statusText}`,
      status: res.status,
    };
    throw error;
  }

  return res.json() as Promise<T>;
}
