// frontend/app/page.tsx

// Import Link so we can add buttons that go to other pages
import Link from "next/link";

// Import our reusable public page wrapper
import PublicPageWrapper from "@/components/public-page-wrapper";

// Home page
export default function HomePage() {
  // Sample featured drinks
  const featuredDrinks = [
    {
      name: "Classic Latte",
      description: "Smooth espresso with creamy milk for a balanced cup.",
    },
    {
      name: "Caramel Cold Brew",
      description: "Refreshing cold brew with a sweet caramel finish.",
    },
    {
      name: "Spanish Latte",
      description: "A rich and sweet coffee favorite for everyday comfort.",
    },
  ];

  // Sample featured promos
  const featuredPromos = [
    "Buy 1 Get 1 on selected iced drinks every Tuesday",
    "Free pastry for orders above ₱350",
    "Student discount available on weekdays",
  ];

  return (
    <PublicPageWrapper>
      {/* Hero section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Brewed for everyday moments
            </p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Good coffee, warm spaces, and simple comfort.
            </h1>
            <p className="mb-8 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              Loyd Coffee Shop brings fresh coffee, cozy branch spaces, and
              everyday favorites for customers who want a place to relax, work,
              or catch up.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white"
              >
                View Menu
              </Link>
              <Link
                href="/branches"
                className="rounded-md border px-5 py-3 text-sm font-medium"
              >
                Find a Branch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured drinks */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Featured Drinks</h2>
          <p className="mt-2 text-gray-600">
            Some of our customer favorites across branches.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredDrinks.map((drink) => (
            <div key={drink.name} className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-semibold">{drink.name}</h3>
              <p className="text-sm leading-6 text-gray-600">
                {drink.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured promos */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Current Promos</h2>
            <p className="mt-2 text-gray-600">
              Enjoy simple offers designed for regular customers and new visitors.
            </p>
          </div>

          <div className="grid gap-4">
            {featuredPromos.map((promo) => (
              <div key={promo} className="rounded-xl border p-5">
                <p className="text-sm font-medium">{promo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl bg-black px-8 py-10 text-white">
          <h2 className="mb-3 text-3xl font-bold">
            Visit your nearest Loyd Coffee Shop branch
          </h2>
          <p className="mb-6 max-w-2xl text-sm leading-6 text-gray-300">
            Whether you want a quiet place to work, a quick coffee break, or a
            comfortable place to meet friends, we are ready to welcome you.
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-md bg-white px-5 py-3 text-sm font-medium text-black"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </PublicPageWrapper>
  );
}