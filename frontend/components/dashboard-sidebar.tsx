// frontend/components/dashboard-sidebar.tsx

"use client";

// We use Link so users can move between dashboard pages
import Link from "next/link";

// We use usePathname so we can highlight the current page
import { usePathname } from "next/navigation";

// This is the reusable sidebar for the private dashboard
export default function DashboardSidebar() {
  // Get the current URL path so we can style the active link
  const pathname = usePathname();

  // These are the private dashboard navigation links
  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Customers", href: "/customers" },
    { label: "Branches", href: "/branches" },
    { label: "Products", href: "/products" },
    { label: "Upload Data", href: "/upload-data" },
    { label: "Insights", href: "/insights" },
    { label: "Recommendations", href: "/recommendations" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <aside className="w-full border-r bg-white md:w-64">
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-bold">Loyd Coffee Shop</h2>
        <p className="text-sm text-gray-500">Internal Dashboard</p>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
          // Check if this nav item matches the current page
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}