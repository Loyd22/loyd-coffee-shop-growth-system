// frontend/app/dashboard/insights/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function InsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const insights = [
    "Biñan Central is leading in weekly revenue growth.",
    "Spanish Latte remains the strongest top-selling product.",
    "Inactive customer count is increasing in two branches.",
    "Cold drinks are performing better during late afternoon hours.",
  ];

  return (
    <DashboardLayout
      title="Insights"
      description="Review key business observations and summary findings."
    >
      <section className="grid gap-4">
        {insights.map((insight) => (
          <div key={insight} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">{insight}</p>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}