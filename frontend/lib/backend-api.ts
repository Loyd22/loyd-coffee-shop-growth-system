const SERVER_BACKEND_BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://127.0.0.1:8000";

export const CLIENT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:8000";

export async function fetchBackendJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${SERVER_BACKEND_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Backend request failed (${response.status}): ${text || response.statusText}`
    );
  }

  return (await response.json()) as T;
}
