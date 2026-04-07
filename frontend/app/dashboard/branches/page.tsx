import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { fetchBackendJson } from "@/lib/backend-api";
import type { BranchInsightsResponse } from "@/lib/backend-types";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function BranchInsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let branchData: BranchInsightsResponse | null = null;
  let loadError: string | null = null;

  try {
    branchData = await fetchBackendJson<BranchInsightsResponse>(
      "/api/v1/insights/branches"
    );
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load branch insights from backend.";
  }

  const summary = branchData?.summary ?? {
    total_branches: 0,
    top_branch_name: null,
    weakest_branch_name: null,
    total_branch_revenue: 0,
  };

  const topBranches = branchData?.top_branches ?? [];
  const branchInsights = branchData?.branches ?? [];
  const recentBranchActivity = branchData?.recent_activity ?? [];

  return (
    <DashboardLayout
      title="Branches"
      description="Compare branch performance and review real branch-level insights."
    >
      {loadError && (
        <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Branches</p>
          <h2 className="text-2xl font-bold">{summary.total_branches}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Top Branch</p>
          <h2 className="text-2xl font-bold">{summary.top_branch_name ?? "N/A"}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Weakest Branch</p>
          <h2 className="text-2xl font-bold">
            {summary.weakest_branch_name ?? "N/A"}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Branch Revenue</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(summary.total_branch_revenue)}
          </h2>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Top Branches by Revenue</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Branch</th>
                <th className="py-3 pr-4">Code</th>
                <th className="py-3 pr-4">Revenue</th>
                <th className="py-3 pr-4">Orders</th>
                <th className="py-3 pr-4">Avg Order Value</th>
                <th className="py-3">Repeat Rate</th>
              </tr>
            </thead>
            <tbody>
              {topBranches.length > 0 ? (
                topBranches.map((branch) => (
                  <tr key={branch.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{branch.branch_name}</td>
                    <td className="py-3 pr-4">{branch.branch_code}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(branch.total_revenue)}
                    </td>
                    <td className="py-3 pr-4">{branch.total_orders}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(branch.average_order_value)}
                    </td>
                    <td className="py-3">
                      {formatPercent(branch.repeat_customer_rate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>
                    No branch data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">All Branch Insights</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Branch</th>
                <th className="py-3 pr-4">City</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Revenue</th>
                <th className="py-3 pr-4">Orders</th>
                <th className="py-3 pr-4">Customers</th>
                <th className="py-3">Latest Activity</th>
              </tr>
            </thead>
            <tbody>
              {branchInsights.length > 0 ? (
                branchInsights.map((branch) => (
                  <tr key={branch.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{branch.branch_name}</td>
                    <td className="py-3 pr-4">{branch.city}</td>
                    <td className="py-3 pr-4 capitalize">{branch.status}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(branch.total_revenue)}
                    </td>
                    <td className="py-3 pr-4">{branch.total_orders}</td>
                    <td className="py-3 pr-4">{branch.unique_customer_count}</td>
                    <td className="py-3">
                      {branch.latest_transaction_date
                        ? formatShortDate(branch.latest_transaction_date)
                        : "No activity"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>
                    No branch records available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Branch Activity</h2>

          <div className="space-y-4">
            {recentBranchActivity.length > 0 ? (
              recentBranchActivity.map((branch) => (
                <div key={branch.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{branch.branch_name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest transaction on{" "}
                    {branch.latest_transaction_date
                      ? formatShortDate(branch.latest_transaction_date)
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Revenue: {formatCurrency(branch.total_revenue)} | Orders:{" "}
                    {branch.total_orders}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No recent branch activity available yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Branch Notes</h2>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Top branch is based on total saved transaction revenue.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps identify which branch is currently driving the most sales.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Repeat customer rate is measured per branch.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps show which branches are building stronger customer loyalty.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Weakest branch is based on the lowest recorded revenue.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps you quickly spot where support or action may be needed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
