// frontend/app/dashboard/branches/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function DashboardBranchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const branches = [
    { name: "Biñan Central", revenue: "₱42,500", orders: 320, repeatRate: "34%" },
    { name: "Santa Rosa", revenue: "₱31,800", orders: 248, repeatRate: "29%" },
    { name: "Calamba", revenue: "₱28,900", orders: 221, repeatRate: "27%" },
    { name: "Cabuyao", revenue: "₱25,400", orders: 205, repeatRate: "25%" },
    { name: "San Pedro", revenue: "₱23,800", orders: 190, repeatRate: "22%" },
  ];

  return (
    <DashboardLayout
      title="Branches"
      description="Compare branch performance and branch-level business activity."
    >
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Top Branch</p>
          <h2 className="text-2xl font-bold">Biñan Central</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Weakest Branch</p>
          <h2 className="text-2xl font-bold">San Pedro</h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Total Branches</p>
          <h2 className="text-2xl font-bold">5</h2>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Branch Performance Table</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Branch</th>
                <th className="py-3 pr-4">Revenue</th>
                <th className="py-3 pr-4">Orders</th>
                <th className="py-3">Repeat Rate</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.name} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium">{branch.name}</td>
                  <td className="py-3 pr-4">{branch.revenue}</td>
                  <td className="py-3 pr-4">{branch.orders}</td>
                  <td className="py-3">{branch.repeatRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}