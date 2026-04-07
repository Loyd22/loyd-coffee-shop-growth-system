// frontend/app/dashboard/branches/page.tsx

// Redirect users if they are not logged in
import { redirect } from "next/navigation";

// Supabase auth check
import { createClient } from "@/lib/supabase/server";

// Prisma database client
import { prisma } from "@/lib/prisma";

// Reusable dashboard layout
import DashboardLayout from "@/components/dashboard-layout";

// Helper: format peso currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

// Helper: format percent
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Helper: short date
function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function BranchInsightsPage() {
  // Protect page using Supabase auth
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all branches with transactions and customers
  const branches = await prisma.branch.findMany({
    include: {
      transactions: {
        include: {
          customer: true,
        },
        orderBy: {
          transactionDate: "desc",
        },
      },
    },
    orderBy: {
      branchName: "asc",
    },
  });

  // Build per-branch metrics
  const branchInsights = branches.map((branch) => {
    const totalRevenue = branch.transactions.reduce((sum, transaction) => {
      return sum + transaction.totalAmount;
    }, 0);

    const totalOrders = branch.transactions.length;

    const averageOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Unique active customers in this branch
    const uniqueCustomers = new Set(
      branch.transactions
        .filter((transaction) => transaction.customerId)
        .map((transaction) => transaction.customerId)
    );

    // Repeat customers in this branch
    const customerOrderCount = new Map<string, number>();

    branch.transactions.forEach((transaction) => {
      if (!transaction.customerId) return;

      const currentCount = customerOrderCount.get(transaction.customerId) ?? 0;
      customerOrderCount.set(transaction.customerId, currentCount + 1);
    });

    const repeatCustomerCount = Array.from(customerOrderCount.values()).filter(
      (count) => count > 1
    ).length;

    const repeatCustomerRate =
      uniqueCustomers.size > 0
        ? (repeatCustomerCount / uniqueCustomers.size) * 100
        : 0;

    const latestTransactionDate =
      branch.transactions.length > 0
        ? branch.transactions[0].transactionDate
        : null;

    return {
      id: branch.id,
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      city: branch.city ?? "N/A",
      address: branch.address ?? "N/A",
      status: branch.status,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      uniqueCustomerCount: uniqueCustomers.size,
      repeatCustomerRate,
      latestTransactionDate,
    };
  });

  // Summary cards
  const totalBranches = branchInsights.length;

  const topBranch =
    branchInsights.length > 0
      ? [...branchInsights].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
      : null;

  const weakestBranch =
    branchInsights.length > 0
      ? [...branchInsights].sort((a, b) => a.totalRevenue - b.totalRevenue)[0]
      : null;

  const totalBranchRevenue = branchInsights.reduce((sum, branch) => {
    return sum + branch.totalRevenue;
  }, 0);

  // Top 5 branches by revenue
  const topBranches = [...branchInsights]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Recent branch activity
  const recentBranchActivity = [...branchInsights]
    .filter((branch) => branch.latestTransactionDate !== null)
    .sort((a, b) => {
      if (!a.latestTransactionDate || !b.latestTransactionDate) return 0;
      return b.latestTransactionDate.getTime() - a.latestTransactionDate.getTime();
    })
    .slice(0, 5);

  return (
    <DashboardLayout
      title="Branches"
      description="Compare branch performance and review real branch-level insights."
    >
      {/* Summary cards */}
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Branches</p>
          <h2 className="text-2xl font-bold">{totalBranches}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Top Branch</p>
          <h2 className="text-2xl font-bold">
            {topBranch ? topBranch.branchName : "N/A"}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Weakest Branch</p>
          <h2 className="text-2xl font-bold">
            {weakestBranch ? weakestBranch.branchName : "N/A"}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Branch Revenue</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(totalBranchRevenue)}
          </h2>
        </div>
      </section>

      {/* Top branches by revenue */}
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
                    <td className="py-3 pr-4 font-medium">{branch.branchName}</td>
                    <td className="py-3 pr-4">{branch.branchCode}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(branch.totalRevenue)}
                    </td>
                    <td className="py-3 pr-4">{branch.totalOrders}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(branch.averageOrderValue)}
                    </td>
                    <td className="py-3">
                      {formatPercent(branch.repeatCustomerRate)}
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

      {/* All branch insights */}
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
                    <td className="py-3 pr-4 font-medium">{branch.branchName}</td>
                    <td className="py-3 pr-4">{branch.city}</td>
                    <td className="py-3 pr-4 capitalize">{branch.status}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(branch.totalRevenue)}
                    </td>
                    <td className="py-3 pr-4">{branch.totalOrders}</td>
                    <td className="py-3 pr-4">{branch.uniqueCustomerCount}</td>
                    <td className="py-3">
                      {branch.latestTransactionDate
                        ? formatShortDate(branch.latestTransactionDate)
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

      {/* Recent branch activity */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Branch Activity</h2>

          <div className="space-y-4">
            {recentBranchActivity.length > 0 ? (
              recentBranchActivity.map((branch) => (
                <div key={branch.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{branch.branchName}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest transaction on{" "}
                    {branch.latestTransactionDate
                      ? formatShortDate(branch.latestTransactionDate)
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Revenue: {formatCurrency(branch.totalRevenue)} | Orders:{" "}
                    {branch.totalOrders}
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