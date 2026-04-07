// frontend/app/dashboard/upload-data/page.tsx

// Import redirect so we can protect the page on the server
import { redirect } from "next/navigation";

// Import the Supabase server client for auth checking
import { createClient } from "@/lib/supabase/server";

// Import the reusable private dashboard layout
import DashboardLayout from "@/components/dashboard-layout";

// Import the upload form client component
import UploadForm from "./upload-form";

export default async function UploadDataPage() {
  // Create the Supabase server client
  const supabase = await createClient();

  // Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout
      title="Upload Data"
      description="Upload CSV files for transactions, customers, products, and branches."
    >
      {/* Instructions card */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Upload Instructions</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Upload one or more CSV files for your business data.</p>
          <p>• Supported files: Transactions, Customers, Products, and Branches CSV.</p>
          <p>• In this step, the system only receives the files successfully.</p>
          <p>• Validation and database saving will be added in the next steps.</p>
        </div>
      </section>

      {/* Upload form */}
      <UploadForm />
    </DashboardLayout>
  );
}