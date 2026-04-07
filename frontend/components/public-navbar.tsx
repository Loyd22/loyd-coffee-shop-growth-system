// frontend/components/public-navbar.tsx

"use client";

// We use Link so users can move between pages without full page reload
import Link from "next/link";

// This is the reusable public navigation bar
export default function PublicNavbar() {
  // These are the navigation links shown in the navbar
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Menu", href: "/menu" },
    { label: "Branches", href: "/branches" },
    { label: "Promos", href: "/promos" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand / company name */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          Loyd Coffee Shop
        </Link>

        {/* Main navigation links */}
        <nav className="hidden gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 transition hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Login button for internal staff */}
        <Link
          href="/login"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Staff Login
        </Link>
      </div>
    </header>
  );
}