// frontend/components/public-page-wrapper.tsx

// Import ReactNode so this wrapper can accept page content inside it
import { ReactNode } from "react";

// Import shared public components
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

// Define the shape of the props this component receives
type PublicPageWrapperProps = {
  children: ReactNode;
};

// Reusable wrapper for all public pages
export default function PublicPageWrapper({
  children,
}: PublicPageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Shared top navbar */}
      <PublicNavbar />

      {/* Main page content */}
      <main>{children}</main>

      {/* Shared footer */}
      <PublicFooter />
    </div>
  );
}