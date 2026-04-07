import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { fetchBackendJson } from "@/lib/backend-api";
import type { RecommendationsResponse } from "@/lib/backend-types";
import { createClient } from "@/lib/supabase/server";

type RecommendationPriority = "High" | "Medium" | "Low";
type RecommendationCategory = "Customer" | "Branch" | "Product";

function getPriorityBadgeClass(priority: RecommendationPriority): string {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-700";
    case "Medium":
      return "bg-yellow-100 text-yellow-700";
    case "Low":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getCategoryBadgeClass(category: RecommendationCategory): string {
  switch (category) {
    case "Customer":
      return "bg-green-100 text-green-700";
    case "Branch":
      return "bg-purple-100 text-purple-700";
    case "Product":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let recommendationData: RecommendationsResponse | null = null;
  let loadError: string | null = null;

  try {
    recommendationData = await fetchBackendJson<RecommendationsResponse>(
      "/api/v1/recommendations"
    );
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load recommendations from backend.";
  }

  const summary = recommendationData?.summary ?? {
    total_recommendations: 0,
    high_priority_count: 0,
    medium_priority_count: 0,
    low_priority_count: 0,
  };

  const recommendations = recommendationData?.recommendations ?? [];
  const customerRecommendations = recommendationData?.customer_recommendations ?? [];
  const branchRecommendations = recommendationData?.branch_recommendations ?? [];
  const productRecommendations = recommendationData?.product_recommendations ?? [];
  const aiSummary = recommendationData?.ai_summary ?? "No AI summary available yet.";
  const nextBestActions = recommendationData?.next_best_actions ?? [];

  return (
    <DashboardLayout
      title="Recommendations"
      description="Rule-based business recommendations generated from real customer, branch, and product data."
    >
      {loadError && (
        <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Recommendations</p>
          <h2 className="text-2xl font-bold">{summary.total_recommendations}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">High Priority</p>
          <h2 className="text-2xl font-bold">{summary.high_priority_count}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Medium Priority</p>
          <h2 className="text-2xl font-bold">{summary.medium_priority_count}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Low Priority</p>
          <h2 className="text-2xl font-bold">{summary.low_priority_count}</h2>
        </div>
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">AI Business Summary</h2>
          <p className="text-sm text-gray-700">{aiSummary}</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Next Best Actions</h2>
          {nextBestActions.length > 0 ? (
            <div className="space-y-3">
              {nextBestActions.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-lg border p-4 text-sm">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No next-best actions available yet.</p>
          )}
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">All Recommendations</h2>

        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((item) => (
              <div key={item.id} className="rounded-lg border p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                      item.priority
                    )}`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">Reason:</span> {item.reason}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Recommended Action:</span>{" "}
                  {item.action}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No recommendations available yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Customer Recommendations</h2>

          <div className="space-y-4">
            {customerRecommendations.length > 0 ? (
              customerRecommendations.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="mb-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No customer recommendations right now.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Branch Recommendations</h2>

          <div className="space-y-4">
            {branchRecommendations.length > 0 ? (
              branchRecommendations.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="mb-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No branch recommendations right now.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Product Recommendations</h2>

          <div className="space-y-4">
            {productRecommendations.length > 0 ? (
              productRecommendations.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="mb-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No product recommendations right now.</p>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
