// frontend/app/dashboard/customers/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function CustomersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const customerStats = [
    { label: "Total Customers", value: "1,280" },
    { label: "Repeat Customers", value: "420" },
    { label: "Inactive Customers", value: "86" },
    { label: "High-Value Customers", value: "102" },
  ];

  const customers = [
    { name: "Juan Dela Cruz", visits: 12, spending: "₱3,200", status: "Active" },
    { name: "Maria Santos", visits: 8, spending: "₱2,450", status: "Active" },
    { name: "Paolo Reyes", visits: 3, spending: "₱760", status: "Inactive" },
    { name: "Anne Flores", visits: 15, spending: "₱4,180", status: "VIP" },
  ];

  return (
    <DashboardLayout
      title="Customers"
      description="View customer-related information and customer behavior overview."
    >
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {customerStats.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">{card.label}</p>
            <h2 className="text-2xl font-bold">{card.value}</h2>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Customer List</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Visits</th>
                <th className="py-3 pr-4">Spending</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.name} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium">{customer.name}</td>
                  <td className="py-3 pr-4">{customer.visits}</td>
                  <td className="py-3 pr-4">{customer.spending}</td>
                  <td className="py-3">{customer.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}