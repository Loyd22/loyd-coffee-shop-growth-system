// frontend/app/promos/page.tsx

// Import the reusable public wrapper
import PublicPageWrapper from "@/components/public-page-wrapper";

// Promos page
export default function PromosPage() {
  // Sample promo data
  const promos = [
    {
      title: "Buy 1 Get 1 Tuesday",
      description:
        "Enjoy a buy 1 get 1 offer on selected iced coffee drinks every Tuesday.",
    },
    {
      title: "Pastry Pairing Promo",
      description:
        "Get a discounted pastry when you order any large hot coffee.",
    },
    {
      title: "Student Weekday Discount",
      description:
        "Students can enjoy special weekday discounts with valid student ID.",
    },
  ];

  return (
    <PublicPageWrapper>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Promos
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          Current Offers
        </h1>
        <p className="mb-12 max-w-2xl text-base leading-7 text-gray-600">
          Discover simple offers and seasonal promos available in participating
          branches.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {promos.map((promo) => (
            <div key={promo.title} className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">{promo.title}</h2>
              <p className="text-sm leading-6 text-gray-600">
                {promo.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageWrapper>
  );
}