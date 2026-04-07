import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { fetchBackendJson } from "@/lib/backend-api";
import type { CustomerInsightsResponse } from "@/lib/backend-types";
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

function getSegmentBadgeClass(segment: string): string {
  switch (segment) {
    case "Loyal Customer":
      return "bg-green-100 text-green-700";
    case "High-Value Customer":
      return "bg-purple-100 text-purple-700";
    case "Frequent Buyer":
      return "bg-blue-100 text-blue-700";
    case "Occasional Buyer":
      return "bg-yellow-100 text-yellow-700";
    case "Inactive Customer":
      return "bg-red-100 text-red-700";
    case "New / One-Time Customer":
      return "bg-gray-100 text-gray-700";
    case "No Orders Yet":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getChurnBadgeClass(status: string): string {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "At Risk":
      return "bg-yellow-100 text-yellow-700";
    case "Churned":
      return "bg-red-100 text-red-700";
    case "No Orders Yet":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function CustomerInsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let customerData: CustomerInsightsResponse | null = null;
  let loadError: string | null = null;

  try {
    customerData = await fetchBackendJson<CustomerInsightsResponse>(
      "/api/v1/insights/customers"
    );
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load customer insights from backend.";
  }

  const summary = customerData?.summary ?? {
    total_customers: 0,
    active_customers: 0,
    repeat_customers: 0,
    inactive_customers: 0,
    loyalty_members: 0,
    total_customer_spending: 0,
    average_customer_spending: 0,
    repeat_customer_rate: 0,
  };

  const segmentSummary = customerData?.segment_summary ?? [];
  const churnSummary = customerData?.churn_summary ?? [];
  const topCustomers = customerData?.top_customers ?? [];
  const churnPriorityCustomers = customerData?.churn_priority_customers ?? [];
  const customerInsights = customerData?.customers ?? [];
  const recentCustomerActivity = customerData?.recent_activity ?? [];

  return (
    <DashboardLayout
      title="Customers"
      description="Review real customer behavior, segmentation, and churn / inactivity insights."
    >
      {loadError && (
        <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Customers</p>
          <h2 className="text-2xl font-bold">{summary.total_customers}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Active Customers</p>
          <h2 className="text-2xl font-bold">{summary.active_customers}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Repeat Customers</p>
          <h2 className="text-2xl font-bold">{summary.repeat_customers}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Inactive Customers</p>
          <h2 className="text-2xl font-bold">{summary.inactive_customers}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Loyalty Members</p>
          <h2 className="text-2xl font-bold">{summary.loyalty_members}</h2>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Average Customer Spending</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(summary.average_customer_spending)}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Repeat Customer Rate</p>
          <h2 className="text-2xl font-bold">
            {formatPercent(summary.repeat_customer_rate)}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Customer Spending</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(summary.total_customer_spending)}
          </h2>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Customer Segmentation Summary</h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {segmentSummary.map((item) => (
            <div key={item.segment} className="rounded-lg border p-4">
              <div
                className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSegmentBadgeClass(
                  item.segment
                )}`}
              >
                {item.segment}
              </div>
              <p className="text-2xl font-bold">{item.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Churn / Inactivity Summary</h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {churnSummary.map((item) => (
            <div key={item.status} className="rounded-lg border p-4">
              <div
                className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChurnBadgeClass(
                  item.status
                )}`}
              >
                {item.status}
              </div>
              <p className="text-2xl font-bold">{item.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Top Customers by Spending</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Segment</th>
                <th className="py-3 pr-4">Churn Status</th>
                <th className="py-3 pr-4">Spending</th>
                <th className="py-3 pr-4">Visits</th>
                <th className="py-3">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length > 0 ? (
                topCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{customer.full_name}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSegmentBadgeClass(
                          customer.segment
                        )}`}
                      >
                        {customer.segment}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChurnBadgeClass(
                          customer.churn_status
                        )}`}
                      >
                        {customer.churn_status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {formatCurrency(customer.total_spending)}
                    </td>
                    <td className="py-3 pr-4">{customer.total_visits}</td>
                    <td className="py-3">
                      {formatCurrency(customer.average_order_value)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>
                    No customer data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Customers Needing Attention</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Churn Status</th>
                <th className="py-3 pr-4">Days Since Last Purchase</th>
                <th className="py-3 pr-4">Last Branch</th>
                <th className="py-3">Total Spending</th>
              </tr>
            </thead>
            <tbody>
              {churnPriorityCustomers.length > 0 ? (
                churnPriorityCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{customer.full_name}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChurnBadgeClass(
                          customer.churn_status
                        )}`}
                      >
                        {customer.churn_status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {customer.days_since_last_purchase ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4">
                      {customer.latest_branch_name ?? "N/A"}
                    </td>
                    <td className="py-3">
                      {formatCurrency(customer.total_spending)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={5}>
                    No at-risk or churned customers right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">All Customer Insights</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Segment</th>
                <th className="py-3 pr-4">Churn Status</th>
                <th className="py-3 pr-4">Visits</th>
                <th className="py-3 pr-4">Spending</th>
                <th className="py-3">Latest Activity</th>
              </tr>
            </thead>
            <tbody>
              {customerInsights.length > 0 ? (
                customerInsights.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{customer.full_name}</td>
                    <td className="py-3 pr-4">{customer.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSegmentBadgeClass(
                          customer.segment
                        )}`}
                      >
                        {customer.segment}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChurnBadgeClass(
                          customer.churn_status
                        )}`}
                      >
                        {customer.churn_status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{customer.total_visits}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(customer.total_spending)}
                    </td>
                    <td className="py-3">
                      {customer.latest_transaction_date
                        ? formatShortDate(customer.latest_transaction_date)
                        : "No activity"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>
                    No customer records available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Customer Activity</h2>

          <div className="space-y-4">
            {recentCustomerActivity.length > 0 ? (
              recentCustomerActivity.map((customer) => (
                <div key={customer.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{customer.full_name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest order on{" "}
                    {customer.latest_transaction_date
                      ? formatShortDate(customer.latest_transaction_date)
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Segment: {customer.segment} | Churn: {customer.churn_status}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Last branch: {customer.latest_branch_name ?? "N/A"} | Spending:{" "}
                    {formatCurrency(customer.total_spending)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No recent customer activity available yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Churn Detection Notes</h2>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Active customers purchased within the last 30 days.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                These customers are currently engaged with the business.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                At Risk customers have not purchased for 31 to 60 days.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                These customers may need reminders, promos, or follow-up actions.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Churned customers have not purchased for more than 60 days.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                These customers are strong re-engagement targets.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                No Orders Yet customers exist in the system but have no transactions.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                These may be newly created profiles or customers not yet converted.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
