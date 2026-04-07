// frontend/app/dashboard/recommendations/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard-layout";

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const recommendations = [
    "Launch a promo for inactive customers in low-repeat branches.",
    "Feature Spanish Latte more strongly in underperforming branches.",
    "Bundle coffee and pastry combinations during weekday afternoons.",
    "Review San Pedro branch product mix and local demand.",
  ];

  return (
    <DashboardLayout
      title="Recommendations"
      description="Suggested next actions to improve growth and customer activity."
    >
      <section className="grid gap-4">
        {recommendations.map((item) => (
          <div key={item} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">{item}</p>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}