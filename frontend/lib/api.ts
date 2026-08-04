"use client";

import { getAccessToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    const hostHint =
      typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? " Open the app at http://localhost:3000 instead of the network URL."
        : "";
    throw new Error(
      `Could not reach ${API_BASE_URL}${path}.${hostHint} Make sure the backend is running.`
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Network failure." }));
    throw new Error(error.detail || "Request failed.");
  }
  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body || {}) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
