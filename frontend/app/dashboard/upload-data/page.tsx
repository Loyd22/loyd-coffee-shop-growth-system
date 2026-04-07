// frontend/app/dashboard/upload-data/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";
import UploadForm from "./upload-form";

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
      description="Upload, validate, and save CSV files into the database."
    >
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Step 22 Data Flow</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Upload one or more CSV files for branches, products, customers, and transactions.</p>
          <p>• The system validates structure and row quality first.</p>
          <p>• Only valid files are allowed to continue to the database save process.</p>
          <p>• If all uploaded files pass validation, the clean data is inserted into the database.</p>
        </div>
      </section>

      <UploadForm />
    </DashboardLayout>
  );
}