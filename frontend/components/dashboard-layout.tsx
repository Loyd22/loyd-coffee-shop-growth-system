// frontend/components/dashboard-layout.tsx

// Import ReactNode so this layout can wrap page content
import { ReactNode } from "react";

// Import reusable dashboard components
import DashboardSidebar from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";

// Define the props for this layout
type DashboardLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

// Reusable private dashboard layout
export default function DashboardLayout({
  title,
  description,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Left sidebar */}
        <DashboardSidebar />

        {/* Right content area */}
        <div className="flex-1">
          {/* Top page header */}
          <DashboardHeader title={title} description={description} />

          {/* Main page content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}