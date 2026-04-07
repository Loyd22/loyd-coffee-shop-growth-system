// frontend/components/public-footer.tsx

// We use Link for quick navigation links in the footer
import Link from "next/link";

// Reusable footer for the public website
export default function PublicFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
        {/* Brand description */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Loyd Coffee Shop</h3>
          <p className="text-sm leading-6 text-gray-600">
            Fresh coffee, cozy spaces, and simple moments shared across our
            branches.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Quick Links</h3>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/menu">Menu</Link>
            <Link href="/branches">Branches</Link>
            <Link href="/promos">Promos</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>

        {/* Contact info */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Contact</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Email: hello@loydcoffee.com</p>
            <p>Phone: +63 912 345 6789</p>
            <p>Hours: 8:00 AM - 9:00 PM</p>
          </div>
        </div>
      </div>

      {/* Bottom copyright line */}
      <div className="border-t px-6 py-4 text-center text-xs text-gray-500">
        © 2026 Loyd Coffee Shop. All rights reserved.
      </div>
    </footer>
  );
}