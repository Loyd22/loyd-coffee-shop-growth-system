// frontend/components/dashboard-sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Customers", href: "/dashboard/customers" },
    { label: "Branches", href: "/dashboard/branches" },
    { label: "Products", href: "/dashboard/products" },
    { label: "Upload Data", href: "/dashboard/upload-data" },
    { label: "Insights", href: "/dashboard/insights" },
    { label: "Recommendations", href: "/dashboard/recommendations" },
    { label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <aside className="w-full border-r bg-white md:w-64">
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-bold">Loyd Coffee Shop</h2>
        <p className="text-sm text-gray-500">Internal Dashboard</p>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
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