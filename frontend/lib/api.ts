"use client";

import { getAccessToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function friendlyError(message: string, status?: number) {
  const lower = message.toLowerCase();
  if (status === 401 || lower.includes("invalid token") || lower.includes("jwt")) {
    return "Your login session expired. Please log in again.";
  }
  if (status === 404) return "We could not find that item. Refresh and try again.";
  if (status === 429) return message || "Too many requests. Please wait a little and try again.";
  if (lower.includes("failed to fetch") || lower.includes("could not reach")) {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (lower.includes("openai returned an empty transcript")) {
    return "I could not hear enough speech. Record at least 5 seconds and speak close to the microphone.";
  }
  if (lower.includes("transcription")) {
    return "Voice transcription failed. Try a shorter, clearer recording.";
  }
  if (lower.includes("database update needed")) return message;
  return message || "Something went wrong. Please try again.";
}

function isBrowserProductionWithLocalApi() {
  return (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    API_BASE_URL.includes("localhost")
  );
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isBrowserProductionWithLocalApi()) {
    throw new Error("Backend URL is not set in Vercel. Set NEXT_PUBLIC_API_BASE_URL to your Render backend URL and redeploy Vercel.");
  }

  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    const productionHint =
      typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? ` Check that NEXT_PUBLIC_API_BASE_URL in Vercel is your Render URL (${API_BASE_URL}) and that Render CORS allows ${window.location.origin}.`
        : "";
    throw new Error(friendlyError(`Could not reach ${API_BASE_URL}${path}.${productionHint}`));
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Network failure." }));
    throw new Error(friendlyError(error.detail || "Request failed.", response.status));
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
