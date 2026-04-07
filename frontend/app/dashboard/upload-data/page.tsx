// frontend/app/dashboard/upload-data/page.tsx

// Import redirect so we can protect the page
import { redirect } from "next/navigation";

// Import Supabase server client for auth checking
import { createClient } from "@/lib/supabase/server";

// Import dashboard layout
import DashboardLayout from "@/components/dashboard-layout";

// Import the upload form
import UploadForm from "./upload-form";

export default async function UploadDataPage() {
  // Create the Supabase server client
  const supabase = await createClient();

  // Check the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout
      title="Upload Data"
      description="Upload and validate CSV files before they are saved into the system."
    >
      {/* Instructions card */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Validation Rules</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Upload one or more CSV files for transactions, customers, products, and branches.</p>
          <p>• The system checks required columns, empty values, duplicates, and basic row quality.</p>
          <p>• Files with issues will show exactly what needs to be fixed.</p>
          <p>• Clean data will be ready for database insertion in the next step.</p>
        </div>
      </section>

      {/* Upload + validation form */}
      <UploadForm />
    </DashboardLayout>
  );
}