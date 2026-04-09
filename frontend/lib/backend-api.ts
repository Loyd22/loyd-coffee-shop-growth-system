// frontend/lib/backend-api.ts

/**
 * This file contains reusable frontend functions for calling the backend API.
 *
 * What is inside this file:
 * - shared backend base URLs
 * - a reusable JSON fetch helper
 * - feature-specific API functions like fetchAiSummary()
 */

// Import the types that describe the request and response data
import type {
  AISummaryRequest,
  AISummaryResponse,
  NextBestActionItem,
  NextBestActionsRequest,
  NextBestActionsResponse,
  RecommendationItem,
  RecommendationsResponse,
} from "./backend-types";

// Backend base URL for server-side code
const SERVER_BACKEND_BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://127.0.0.1:8000";

// Backend base URL for client-side code if needed later
export const CLIENT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:8000";

/**
 * Reusable helper for fetching JSON from the backend.
 *
 * Why this is useful:
 * - avoids repeating fetch logic in many functions
 * - centralizes error handling
 * - makes feature-specific functions cleaner
 */
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPriority(value: unknown): value is "High" | "Medium" | "Low" {
  return value === "High" || value === "Medium" || value === "Low";
}

function isCategory(
  value: unknown
): value is "Customer" | "Branch" | "Product" {
  return value === "Customer" || value === "Branch" || value === "Product";
}

function isNextBestActionCategory(
  value: unknown
): value is "Customer" | "Branch" | "Product" | "Overall" {
  return (
    value === "Customer" ||
    value === "Branch" ||
    value === "Product" ||
    value === "Overall"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAiSummaryResponse(value: unknown): value is AISummaryResponse {
  return (
    isObject(value) &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isStringArray(value.highlights) &&
    isStringArray(value.risks) &&
    typeof value.focus_area === "string"
  );
}

function isRecommendationItem(value: unknown): value is RecommendationItem {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    isCategory(value.category) &&
    isPriority(value.priority) &&
    typeof value.title === "string" &&
    typeof value.reason === "string" &&
    typeof value.action === "string"
  );
}

function isNextBestActionItem(value: unknown): value is NextBestActionItem {
  return (
    isObject(value) &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isStringArray(value.reasons) &&
    typeof value.recommended_action === "string" &&
    isPriority(value.priority) &&
    isNextBestActionCategory(value.category)
  );
}

function isRecommendationsResponse(value: unknown): value is RecommendationsResponse {
  return (
    isObject(value) &&
    isObject(value.summary) &&
    typeof value.summary.total_recommendations === "number" &&
    typeof value.summary.high_priority_count === "number" &&
    typeof value.summary.medium_priority_count === "number" &&
    typeof value.summary.low_priority_count === "number" &&
    Array.isArray(value.recommendations) &&
    value.recommendations.every(isRecommendationItem) &&
    Array.isArray(value.customer_recommendations) &&
    value.customer_recommendations.every(isRecommendationItem) &&
    Array.isArray(value.branch_recommendations) &&
    value.branch_recommendations.every(isRecommendationItem) &&
    Array.isArray(value.product_recommendations) &&
    value.product_recommendations.every(isRecommendationItem) &&
    isAiSummaryResponse(value.ai_summary) &&
    Array.isArray(value.next_best_actions) &&
    value.next_best_actions.every(isNextBestActionItem) &&
    typeof value.next_best_actions_used_fallback === "boolean"
  );
}

/**
 * Sends structured business metrics to the backend AI summary endpoint.
 *
 * What this function does:
 * - sends a POST request to /api/v1/ai/summary
 * - passes the summary payload as JSON
 * - returns the AI summary response
 */
export async function fetchAiSummary(
  payload: AISummaryRequest
): Promise<AISummaryResponse> {
  return fetchBackendJson<AISummaryResponse>("/api/v1/ai/summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Sends structured metrics to Step 31 next-best-actions endpoint.
 *
 * What this function does:
 * - sends a POST request to /api/v1/ai/next-best-actions
 * - returns structured action cards for UI rendering
 */
export async function fetchNextBestActions(
  payload: NextBestActionsRequest
): Promise<NextBestActionsResponse> {
  const data = await fetchBackendJson<unknown>("/api/v1/ai/next-best-actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!isObject(data) || !Array.isArray(data.actions) || typeof data.used_fallback !== "boolean") {
    throw new Error("Backend response shape for next best actions is invalid.");
  }

  if (!data.actions.every(isNextBestActionItem)) {
    throw new Error("Backend next best actions payload contains invalid action items.");
  }

  return data as NextBestActionsResponse;
}

/**
 * Fetch recommendations and validate the runtime response shape.
 *
 * Why this is important:
 * - TypeScript types are compile-time only
 * - runtime guards prevent rendering malformed payloads
 */
export async function fetchRecommendations(): Promise<RecommendationsResponse> {
  const data = await fetchBackendJson<unknown>("/api/v1/recommendations");

  if (!isRecommendationsResponse(data)) {
    throw new Error("Backend recommendations response shape is invalid.");
  }

  return data;
}
