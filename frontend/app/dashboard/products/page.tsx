import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { fetchBackendJson } from "@/lib/backend-api";
import type { ProductInsightsResponse } from "@/lib/backend-types";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function ProductInsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let productData: ProductInsightsResponse | null = null;
  let loadError: string | null = null;

  try {
    productData = await fetchBackendJson<ProductInsightsResponse>(
      "/api/v1/insights/products"
    );
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load product insights from backend.";
  }

  const summary = productData?.summary ?? {
    total_products: 0,
    top_product_name: null,
    weakest_product_name: null,
    total_product_revenue: 0,
  };

  const topProducts = productData?.top_products ?? [];
  const productInsights = productData?.products ?? [];
  const recentProductActivity = productData?.recent_activity ?? [];

  return (
    <DashboardLayout
      title="Products"
      description="Review real product performance and product-level sales insights."
    >
      {loadError && (
        <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Products</p>
          <h2 className="text-2xl font-bold">{summary.total_products}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Top Product</p>
          <h2 className="text-2xl font-bold">{summary.top_product_name ?? "N/A"}</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Weakest Product</p>
          <h2 className="text-2xl font-bold">
            {summary.weakest_product_name ?? "N/A"}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Product Revenue</p>
          <h2 className="text-2xl font-bold">
            {formatCurrency(summary.total_product_revenue)}
          </h2>
        </div>
      </section>

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
                    <td className="py-3 pr-4 font-medium">{product.product_name}</td>
                    <td className="py-3 pr-4">{product.category}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.total_revenue)}
                    </td>
                    <td className="py-3 pr-4">{product.total_units_sold}</td>
                    <td className="py-3 pr-4">{product.total_orders}</td>
                    <td className="py-3">
                      {formatCurrency(product.average_selling_price)}
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
                    <td className="py-3 pr-4 font-medium">{product.product_name}</td>
                    <td className="py-3 pr-4">{product.category}</td>
                    <td className="py-3 pr-4 capitalize">{product.status}</td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.base_price)}
                    </td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.total_revenue)}
                    </td>
                    <td className="py-3 pr-4">{product.total_units_sold}</td>
                    <td className="py-3">
                      {product.latest_activity_date
                        ? formatShortDate(product.latest_activity_date)
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

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Product Activity</h2>

          <div className="space-y-4">
            {recentProductActivity.length > 0 ? (
              recentProductActivity.map((product) => (
                <div key={product.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{product.product_name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest sale on{" "}
                    {product.latest_activity_date
                      ? formatShortDate(product.latest_activity_date)
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Revenue: {formatCurrency(product.total_revenue)} | Units:{" "}
                    {product.total_units_sold}
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
