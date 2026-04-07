// frontend/app/dashboard/customers/page.tsx

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

export default async function CustomerInsightsPage() {
  // Protect page using Supabase auth
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all customers with their transactions
  const customers = await prisma.customer.findMany({
    include: {
      transactions: {
        include: {
          branch: true,
        },
        orderBy: {
          transactionDate: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Current date and inactive threshold
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Build per-customer metrics
  const customerInsights = customers.map((customer) => {
    const totalVisits = customer.transactions.length;

    const totalSpending = customer.transactions.reduce((sum, transaction) => {
      return sum + transaction.totalAmount;
    }, 0);

    const averageOrderValue =
      totalVisits > 0 ? totalSpending / totalVisits : 0;

    const latestTransactionDate =
      customer.transactions.length > 0
        ? customer.transactions[0].transactionDate
        : null;

    const latestBranchName =
      customer.transactions.length > 0
        ? customer.transactions[0].branch.branchName
        : null;

    const isRepeatCustomer = totalVisits > 1;
    const isActiveCustomer =
      latestTransactionDate !== null && latestTransactionDate >= thirtyDaysAgo;
    const isInactiveCustomer =
      totalVisits > 0 &&
      latestTransactionDate !== null &&
      latestTransactionDate < thirtyDaysAgo;

    return {
      id: customer.id,
      customerCode: customer.customerCode ?? "N/A",
      fullName: customer.fullName ?? "Unnamed Customer",
      email: customer.email ?? "No email",
      phoneNumber: customer.phoneNumber ?? "No phone",
      gender: customer.gender ?? "N/A",
      loyaltyMember: customer.loyaltyMember,
      totalVisits,
      totalSpending,
      averageOrderValue,
      latestTransactionDate,
      latestBranchName,
      isRepeatCustomer,
      isActiveCustomer,
      isInactiveCustomer,
    };
  });

  // Summary metrics
  const totalCustomers = customerInsights.length;

  const activeCustomers = customerInsights.filter(
    (customer) => customer.isActiveCustomer
  );

  const repeatCustomers = customerInsights.filter(
    (customer) => customer.isRepeatCustomer
  );

  const inactiveCustomers = customerInsights.filter(
    (customer) => customer.isInactiveCustomer
  );

  const loyaltyMembers = customerInsights.filter(
    (customer) => customer.loyaltyMember
  );

  const totalCustomerSpending = customerInsights.reduce((sum, customer) => {
    return sum + customer.totalSpending;
  }, 0);

  const averageCustomerSpending =
    totalCustomers > 0 ? totalCustomerSpending / totalCustomers : 0;

  const repeatCustomerRate =
    totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0;

  // Top 5 customers by spending
  const topCustomers = [...customerInsights]
    .sort((a, b) => b.totalSpending - a.totalSpending)
    .slice(0, 5);

  // Recent customer activity
  const recentCustomerActivity = [...customerInsights]
    .filter((customer) => customer.latestTransactionDate !== null)
    .sort((a, b) => {
      if (!a.latestTransactionDate || !b.latestTransactionDate) return 0;
      return b.latestTransactionDate.getTime() - a.latestTransactionDate.getTime();
    })
    .slice(0, 5);

  return (
    <DashboardLayout
      title="Customers"
      description="Review real customer behavior, spending, and activity insights."
    >
      {/* Summary cards */}
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Customers</p>
          <h2 className="text-2xl font-bold">{totalCustomers}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Active Customers</p>
          <h2 className="text-2xl font-bold">{activeCustomers.length}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Repeat Customers</p>
          <h2 className="text-2xl font-bold">{repeatCustomers.length}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Inactive Customers</p>
          <h2 className="text-2xl font-bold">{inactiveCustomers.length}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Loyalty Members</p>
          <h2 className="text-2xl font-bold">{loyaltyMembers.length}</h2>
        </div>
      </section>

      {/* Customer KPI strip */}
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Average Customer Spending</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(averageCustomerSpending)}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Repeat Customer Rate</p>
          <h2 className="text-2xl font-bold">
            {formatPercent(repeatCustomerRate)}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Customer Spending</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(totalCustomerSpending)}
          </h2>
        </div>
      </section>

      {/* Top customers by spending */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Top Customers by Spending</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Customer Code</th>
                <th className="py-3 pr-4">Spending</th>
                <th className="py-3 pr-4">Visits</th>
                <th className="py-3 pr-4">Avg Order</th>
                <th className="py-3">Loyalty</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length > 0 ? (
                topCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{customer.fullName}</td>
                    <td className="py-3 pr-4">{customer.customerCode}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(customer.totalSpending)}
                    </td>
                    <td className="py-3 pr-4">{customer.totalVisits}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(customer.averageOrderValue)}
                    </td>
                    <td className="py-3">
                      {customer.loyaltyMember ? "Member" : "Non-member"}
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

      {/* All customer insights */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">All Customer Insights</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Visits</th>
                <th className="py-3 pr-4">Spending</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Latest Activity</th>
              </tr>
            </thead>
            <tbody>
              {customerInsights.length > 0 ? (
                customerInsights.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{customer.fullName}</td>
                    <td className="py-3 pr-4">{customer.email}</td>
                    <td className="py-3 pr-4">{customer.phoneNumber}</td>
                    <td className="py-3 pr-4">{customer.totalVisits}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(customer.totalSpending)}
                    </td>
                    <td className="py-3 pr-4">
                      {customer.isInactiveCustomer
                        ? "Inactive"
                        : customer.isActiveCustomer
                        ? "Active"
                        : "No Orders"}
                    </td>
                    <td className="py-3">
                      {customer.latestTransactionDate
                        ? formatShortDate(customer.latestTransactionDate)
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

      {/* Recent customer activity + notes */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Customer Activity</h2>

          <div className="space-y-4">
            {recentCustomerActivity.length > 0 ? (
              recentCustomerActivity.map((customer) => (
                <div key={customer.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{customer.fullName}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest order on{" "}
                    {customer.latestTransactionDate
                      ? formatShortDate(customer.latestTransactionDate)
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Last branch: {customer.latestBranchName ?? "N/A"} | Spending:{" "}
                    {formatCurrency(customer.totalSpending)}
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
          <h2 className="mb-4 text-lg font-semibold">Customer Notes</h2>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Active customers are based on purchases within the last 30 days.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps show which customers are currently engaged with the brand.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Repeat customers are customers with more than one recorded visit.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps measure retention and repeat buying behavior.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Inactive customers are customers with no purchase in the last 30 days.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps identify customers who may need promos or re-engagement.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}