import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { fetchBackendJson } from "@/lib/backend-api";
import type { DashboardSummaryResponse } from "@/lib/backend-types";
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let dashboardData: DashboardSummaryResponse | null = null;
  let loadError: string | null = null;

  try {
    dashboardData = await fetchBackendJson<DashboardSummaryResponse>(
      "/api/v1/dashboard/summary"
    );
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard data from backend.";
  }

  const summary = dashboardData?.summary ?? {
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0,
    repeat_customer_rate: 0,
    inactive_customer_count: 0,
  };

  const topProducts = dashboardData?.top_products ?? [];
  const topBranches = dashboardData?.top_branches ?? [];
  const revenueTrend = dashboardData?.revenue_trend ?? [];
  const recentTransactions = dashboardData?.recent_transactions ?? [];

  const maxRevenueInTrend = Math.max(
    ...revenueTrend.map((item) => item.revenue),
    1
  );

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary.total_revenue),
    },
    {
      label: "Total Orders",
      value: summary.total_orders.toLocaleString(),
    },
    {
      label: "Average Order Value",
      value: formatCurrency(summary.average_order_value),
    },
    {
      label: "Repeat Customer Rate",
      value: formatPercent(summary.repeat_customer_rate),
    },
    {
      label: "Inactive Customers",
      value: summary.inactive_customer_count.toLocaleString(),
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      description={`Welcome back, ${user.email}. Here is your real business overview.`}
    >
      {loadError && (
        <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="mb-2 text-sm text-gray-500">{card.label}</p>
            <h2 className="text-2xl font-bold">{card.value}</h2>
          </div>
        ))}
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Revenue Trend</h2>
          <p className="mb-6 text-sm text-gray-500">
            Revenue for the last 7 days based on saved transactions.
          </p>

          <div className="space-y-4">
            {revenueTrend.map((item) => (
              <div key={item.date}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.revenue)}</span>
                </div>

                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full bg-black"
                    style={{
                      width: `${(item.revenue / maxRevenueInTrend) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Top Branches</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Branch</th>
                  <th className="py-3 pr-4">Revenue</th>
                  <th className="py-3">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topBranches.length > 0 ? (
                  topBranches.map((branch) => (
                    <tr key={branch.branch_id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{branch.branch_name}</td>
                      <td className="py-3 pr-4">
                        {formatCurrency(branch.total_revenue)}
                      </td>
                      <td className="py-3">{branch.total_orders}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>
                      No branch data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Top Products</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Sales</th>
                  <th className="py-3">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {product.product_name}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(product.total_sales)}
                      </td>
                      <td className="py-3">{product.total_units}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>
                      No product data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Branch</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {transaction.transaction_code}
                      </td>
                      <td className="py-3 pr-4">{transaction.branch_name}</td>
                      <td className="py-3 pr-4">
                        {formatShortDate(transaction.transaction_date)}
                      </td>
                      <td className="py-3">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={4}>
                      No transactions available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
