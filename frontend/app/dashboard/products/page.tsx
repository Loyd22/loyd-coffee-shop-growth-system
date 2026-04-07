// frontend/app/dashboard/products/page.tsx

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

// Helper: short date
function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function ProductInsightsPage() {
  // Protect page using Supabase auth
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get products with related transaction items and transactions
  const products = await prisma.product.findMany({
    include: {
      transactionItems: {
        include: {
          transaction: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      productName: "asc",
    },
  });

  // Build per-product metrics
  const productInsights = products.map((product) => {
    const totalRevenue = product.transactionItems.reduce((sum, item) => {
      return sum + item.lineTotal;
    }, 0);

    const totalUnitsSold = product.transactionItems.reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);

    const totalOrders = product.transactionItems.length;

    const averageSellingPrice =
      totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;

    const latestActivityDate =
      product.transactionItems.length > 0
        ? product.transactionItems.reduce((latest, item) => {
            return item.transaction.transactionDate > latest
              ? item.transaction.transactionDate
              : latest;
          }, product.transactionItems[0].transaction.transactionDate)
        : null;

    return {
      id: product.id,
      productName: product.productName,
      category: product.category ?? "Uncategorized",
      status: product.status,
      basePrice: product.price,
      totalRevenue,
      totalUnitsSold,
      totalOrders,
      averageSellingPrice,
      latestActivityDate,
    };
  });

  // Summary metrics
  const totalProducts = productInsights.length;

  const topProduct =
    productInsights.length > 0
      ? [...productInsights].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
      : null;

  const weakestProduct =
    productInsights.length > 0
      ? [...productInsights].sort((a, b) => a.totalRevenue - b.totalRevenue)[0]
      : null;

  const totalProductRevenue = productInsights.reduce((sum, product) => {
    return sum + product.totalRevenue;
  }, 0);

  // Top 5 products by revenue
  const topProducts = [...productInsights]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Recent product activity
  const recentProductActivity = [...productInsights]
    .filter((product) => product.latestActivityDate !== null)
    .sort((a, b) => {
      if (!a.latestActivityDate || !b.latestActivityDate) return 0;
      return b.latestActivityDate.getTime() - a.latestActivityDate.getTime();
    })
    .slice(0, 5);

  return (
    <DashboardLayout
      title="Products"
      description="Review real product performance and product-level sales insights."
    >
      {/* Summary cards */}
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Products</p>
          <h2 className="text-2xl font-bold">{totalProducts}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Top Product</p>
          <h2 className="text-2xl font-bold">
            {topProduct ? topProduct.productName : "N/A"}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Weakest Product</p>
          <h2 className="text-2xl font-bold">
            {weakestProduct ? weakestProduct.productName : "N/A"}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Product Revenue</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(totalProductRevenue)}
          </h2>
        </div>
      </section>

      {/* Top products by revenue */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Top Products by Revenue</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Revenue</th>
                <th className="py-3 pr-4">Units Sold</th>
                <th className="py-3 pr-4">Orders</th>
                <th className="py-3">Avg Selling Price</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">
                      {product.productName}
                    </td>
                    <td className="py-3 pr-4">{product.category}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-3 pr-4">{product.totalUnitsSold}</td>
                    <td className="py-3 pr-4">{product.totalOrders}</td>
                    <td className="py-3">
                      {formatCurrency(product.averageSellingPrice)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>
                    No product data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* All product insights */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">All Product Insights</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Base Price</th>
                <th className="py-3 pr-4">Revenue</th>
                <th className="py-3 pr-4">Units Sold</th>
                <th className="py-3">Latest Activity</th>
              </tr>
            </thead>
            <tbody>
              {productInsights.length > 0 ? (
                productInsights.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">
                      {product.productName}
                    </td>
                    <td className="py-3 pr-4">{product.category}</td>
                    <td className="py-3 pr-4 capitalize">{product.status}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.basePrice)}
                    </td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-3 pr-4">{product.totalUnitsSold}</td>
                    <td className="py-3">
                      {product.latestActivityDate
                        ? formatShortDate(product.latestActivityDate)
                        : "No activity"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>
                    No product records available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent product activity + notes */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Product Activity</h2>

          <div className="space-y-4">
            {recentProductActivity.length > 0 ? (
              recentProductActivity.map((product) => (
                <div key={product.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{product.productName}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest sale on{" "}
                    {product.latestActivityDate
                      ? formatShortDate(product.latestActivityDate)
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Revenue: {formatCurrency(product.totalRevenue)} | Units:{" "}
                    {product.totalUnitsSold}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No recent product activity available yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Product Notes</h2>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Top product is based on total recorded line sales.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps identify which products are bringing the most revenue.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Average selling price is based on total sales divided by units sold.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps compare how products are actually performing in transactions.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                Weakest product is based on the lowest recorded revenue.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This helps identify which products may need review, promotion, or replacement.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}