// frontend/app/menu/page.tsx

// Import the reusable public wrapper
import PublicPageWrapper from "@/components/public-page-wrapper";

// Menu page
export default function MenuPage() {
  // Sample menu categories and items
  const menuSections = [
    {
      title: "Coffee",
      items: [
        { name: "Americano", price: "₱120" },
        { name: "Cappuccino", price: "₱150" },
        { name: "Cafe Latte", price: "₱160" },
        { name: "Spanish Latte", price: "₱175" },
      ],
    },
    {
      title: "Cold Drinks",
      items: [
        { name: "Iced Americano", price: "₱130" },
        { name: "Caramel Cold Brew", price: "₱180" },
        { name: "Mocha Frappe", price: "₱195" },
      ],
    },
    {
      title: "Pastries",
      items: [
        { name: "Croissant", price: "₱95" },
        { name: "Chocolate Muffin", price: "₱110" },
        { name: "Cinnamon Roll", price: "₱120" },
      ],
    },
    {
      title: "Seasonal Drinks",
      items: [
        { name: "Hazelnut Latte", price: "₱185" },
        { name: "Vanilla Cream Cold Brew", price: "₱190" },
      ],
    },
  ];

  return (
    <PublicPageWrapper>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Our Menu
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">Coffee and More</h1>
        <p className="mb-12 max-w-2xl text-base leading-7 text-gray-600">
          Explore our coffee favorites, refreshing drinks, and pastries made to
          pair with your daily routine.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {menuSections.map((section) => (
            <div key={section.title} className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>

              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between border-b pb-3 last:border-b-0"
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-gray-600">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicPageWrapper>
  );
}