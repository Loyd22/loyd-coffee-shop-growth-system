// frontend/app/dashboard/products/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function ProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const productStats = [
    { label: "Top Product", value: "Spanish Latte" },
    { label: "Low Performer", value: "Chocolate Muffin" },
    { label: "Total Products", value: "18" },
    { label: "Best Category", value: "Coffee" },
  ];

  const products = [
    { name: "Spanish Latte", category: "Coffee", sales: "₱24,500", units: 210 },
    { name: "Classic Latte", category: "Coffee", sales: "₱17,850", units: 154 },
    { name: "Caramel Cold Brew", category: "Cold Drinks", sales: "₱19,200", units: 168 },
    { name: "Croissant", category: "Pastries", sales: "₱9,400", units: 121 },
  ];

  return (
    <DashboardLayout
      title="Products"
      description="Review product performance and monitor top and low-performing items."
    >
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productStats.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">{card.label}</p>
            <h2 className="text-2xl font-bold">{card.value}</h2>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Product Performance Table</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Sales</th>
                <th className="py-3">Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.name} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium">{product.name}</td>
                  <td className="py-3 pr-4">{product.category}</td>
                  <td className="py-3 pr-4">{product.sales}</td>
                  <td className="py-3">{product.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}