// frontend/app/dashboard/page.tsx

// This lets us redirect from the server before rendering
import { redirect } from "next/navigation";

// Import the server-side Supabase client
import { createClient } from "@/lib/supabase/server";

// Import the reusable private dashboard layout
import DashboardLayout from "@/components/dashboard-layout";

// Dashboard page
export default async function DashboardPage() {
  // Create the Supabase server client
  const supabase = await createClient();

  // Get the currently logged in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If there is no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Sample KPI cards for layout only
  const kpiCards = [
    { label: "Total Revenue", value: "₱152,400" },
    { label: "Total Orders", value: "1,248" },
    { label: "Average Order Value", value: "₱122.12" },
    { label: "Inactive Customers", value: "86" },
  ];

  // Sample top products table rows
  const topProducts = [
    { name: "Spanish Latte", sales: "₱24,500", orders: 210 },
    { name: "Caramel Cold Brew", sales: "₱19,200", orders: 168 },
    { name: "Classic Latte", sales: "₱17,850", orders: 154 },
    { name: "Croissant", sales: "₱9,400", orders: 121 },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      description={`Welcome back, ${user.email}. Here is your business overview.`}
    >
      {/* KPI cards */}
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      {/* Charts row */}
      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        {/* Revenue trend placeholder */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Revenue Trend</h2>
          <p className="mb-6 text-sm text-gray-500">
            This section will later show revenue over time using charts.
          </p>

          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-gray-400">
            Revenue chart placeholder
          </div>
        </div>

        {/* Branch performance placeholder */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Branch Performance</h2>
          <p className="mb-6 text-sm text-gray-500">
            This section will later compare sales and orders across branches.
          </p>

          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-gray-400">
            Branch chart placeholder
          </div>
        </div>
      </section>

      {/* Bottom row */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Top products table */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Top Products</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Sales</th>
                  <th className="py-3">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.name} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                    <td className="py-3 pr-4">{product.sales}</td>
                    <td className="py-3">{product.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity / insights placeholder */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Insights</h2>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Biñan Central had the highest weekly sales growth.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Weekly trend placeholder for branch performance insights.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Spanish Latte remains the top-selling product.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Product trend placeholder for future analytics.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Inactive customer count increased this week.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This will later connect to inactivity detection logic.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}