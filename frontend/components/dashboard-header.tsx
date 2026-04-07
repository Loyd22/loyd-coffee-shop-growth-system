// frontend/components/dashboard-header.tsx

// Import the logout button from your dashboard folder
import LogoutButton from "@/app/dashboard/logout-button";

// Define the props this component accepts
type DashboardHeaderProps = {
  title: string;
  description: string;
};

// Reusable dashboard header
export default function DashboardHeader({
  title,
  description,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <LogoutButton />
    </div>
  );
}