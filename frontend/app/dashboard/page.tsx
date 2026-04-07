// frontend/app/dashboard/page.tsx

// This lets us redirect unauthenticated users before rendering
import { redirect } from "next/navigation";

// Supabase server client for auth protection
import { createClient } from "@/lib/supabase/server";

// Prisma client for database reads
import { prisma } from "@/lib/prisma";

// Reusable dashboard layout from Step 18
import DashboardLayout from "@/components/dashboard-layout";

// Helper function to format money nicely
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

// Helper function to format percent nicely
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Helper function to format dates like Apr 06
function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function DashboardPage() {
  // Protect the page with Supabase auth
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch transactions with related branch, customer, and items/product
  const transactions = await prisma.transaction.findMany({
    include: {
      branch: true,
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
  });

  // Fetch all customers so we can compute inactivity properly
  const customers = await prisma.customer.findMany({
    include: {
      transactions: true,
    },
  });

  // -----------------------------
  // KPI CALCULATIONS
  // -----------------------------

  const totalOrders = transactions.length;

  const totalRevenue = transactions.reduce((sum, transaction) => {
    return sum + transaction.totalAmount;
  }, 0);

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Repeat customer rate:
  // Customers who have more than 1 transaction divided by customers who have at least 1 transaction
  const customersWithOrders = customers.filter(
    (customer) => customer.transactions.length > 0
  );

  const repeatCustomers = customersWithOrders.filter(
    (customer) => customer.transactions.length > 1
  );

  const repeatCustomerRate =
    customersWithOrders.length > 0
      ? (repeatCustomers.length / customersWithOrders.length) * 100
      : 0;

  // Inactive customer count:
  // Customers with at least one transaction but no transaction in the last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const inactiveCustomers = customers.filter((customer) => {
    if (customer.transactions.length === 0) return false;

    const latestTransactionDate = customer.transactions.reduce((latest, txn) => {
      return txn.transactionDate > latest ? txn.transactionDate : latest;
    }, customer.transactions[0].transactionDate);

    return latestTransactionDate < thirtyDaysAgo;
  });

  const inactiveCustomerCount = inactiveCustomers.length;

  // -----------------------------
  // TOP PRODUCTS
  // -----------------------------

  const productMap = new Map<
    string,
    {
      productName: string;
      totalSales: number;
      totalUnits: number;
    }
  >();

  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      const existing = productMap.get(item.productId);

      if (existing) {
        existing.totalSales += item.lineTotal;
        existing.totalUnits += item.quantity;
      } else {
        productMap.set(item.productId, {
          productName: item.product.productName,
          totalSales: item.lineTotal,
          totalUnits: item.quantity,
        });
      }
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  // -----------------------------
  // TOP BRANCHES
  // -----------------------------

  const branchMap = new Map<
    string,
    {
      branchName: string;
      totalRevenue: number;
      totalOrders: number;
    }
  >();

  transactions.forEach((transaction) => {
    const existing = branchMap.get(transaction.branchId);

    if (existing) {
      existing.totalRevenue += transaction.totalAmount;
      existing.totalOrders += 1;
    } else {
      branchMap.set(transaction.branchId, {
        branchName: transaction.branch.branchName,
        totalRevenue: transaction.totalAmount,
        totalOrders: 1,
      });
    }
  });

  const topBranches = Array.from(branchMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // -----------------------------
  // REVENUE TREND (LAST 7 DAYS)
  // -----------------------------

  const revenueTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(today.getDate() - (6 - index));

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const revenueForDay = transactions
      .filter(
        (transaction) =>
          transaction.transactionDate >= startOfDay &&
          transaction.transactionDate <= endOfDay
      )
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);

    return {
      label: formatShortDate(date),
      revenue: revenueForDay,
    };
  });

  const maxRevenueInTrend = Math.max(
    ...revenueTrend.map((item) => item.revenue),
    1
  );

  // -----------------------------
  // RECENT TRANSACTIONS
  // -----------------------------

  const recentTransactions = transactions.slice(0, 5);

  // KPI cards
  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
    },
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
    },
    {
      label: "Average Order Value",
      value: formatCurrency(averageOrderValue),
    },
    {
      label: "Repeat Customer Rate",
      value: formatPercent(repeatCustomerRate),
    },
    {
      label: "Inactive Customers",
      value: inactiveCustomerCount.toLocaleString(),
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      description={`Welcome back, ${user.email}. Here is your real business overview.`}
    >
      {/* KPI cards */}
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

      {/* Revenue trend + top branches */}
      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        {/* Revenue trend */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Revenue Trend</h2>
          <p className="mb-6 text-sm text-gray-500">
            Revenue for the last 7 days based on saved transactions.
          </p>

          <div className="space-y-4">
            {revenueTrend.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">
                    {formatCurrency(item.revenue)}
                  </span>
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

        {/* Top branches */}
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
                    <tr
                      key={branch.branchName}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {branch.branchName}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(branch.totalRevenue)}
                      </td>
                      <td className="py-3">{branch.totalOrders}</td>
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

      {/* Top products + recent transactions */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Top products */}
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
                      key={product.productName}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {product.productName}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(product.totalSales)}
                      </td>
                      <td className="py-3">{product.totalUnits}</td>
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

        {/* Recent transactions */}
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
                      key={transaction.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {transaction.transactionCode}
                      </td>
                      <td className="py-3 pr-4">
                        {transaction.branch.branchName}
                      </td>
                      <td className="py-3 pr-4">
                        {formatShortDate(transaction.transactionDate)}
                      </td>
                      <td className="py-3">
                        {formatCurrency(transaction.totalAmount)}
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