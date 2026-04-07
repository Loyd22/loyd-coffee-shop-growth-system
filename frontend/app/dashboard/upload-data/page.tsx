// frontend/app/dashboard/upload-data/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function UploadDataPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout
      title="Upload Data"
      description="Prepare and upload business data files for dashboard analytics."
    >
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Expected File Types</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Transactions CSV</li>
            <li>• Customers CSV</li>
            <li>• Products CSV</li>
            <li>• Branches CSV</li>
          </ul>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Upload Area</h2>
          <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-sm text-gray-400">
            CSV upload form placeholder
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}