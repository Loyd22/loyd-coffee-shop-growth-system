// frontend/app/dashboard/settings/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout
      title="Settings"
      description="Manage system preferences and future admin controls."
    >
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">User Preferences</h2>
          <p className="text-sm text-gray-600">
            Placeholder for future profile, display, and notification settings.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">System Management</h2>
          <p className="text-sm text-gray-600">
            Placeholder for future role management, uploads, and admin tools.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}