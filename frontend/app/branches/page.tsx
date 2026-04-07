// frontend/app/branches/page.tsx

// Import the reusable public wrapper
import PublicPageWrapper from "@/components/public-page-wrapper";

// Branches page
export default function BranchesPage() {
  // Sample branch list for the fictional client
  const branches = [
    {
      name: "Biñan Central",
      address: "123 Main Road, Biñan, Laguna",
      hours: "8:00 AM - 9:00 PM",
    },
    {
      name: "Santa Rosa Branch",
      address: "45 Market Avenue, Santa Rosa, Laguna",
      hours: "8:00 AM - 10:00 PM",
    },
    {
      name: "Calamba Branch",
      address: "78 City Center Street, Calamba, Laguna",
      hours: "8:00 AM - 9:00 PM",
    },
    {
      name: "Cabuyao Branch",
      address: "22 Riverside Drive, Cabuyao, Laguna",
      hours: "8:00 AM - 9:30 PM",
    },
    {
      name: "San Pedro Branch",
      address: "15 Business Park Road, San Pedro, Laguna",
      hours: "8:00 AM - 9:00 PM",
    },
  ];

  return (
    <PublicPageWrapper>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Our Branches
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          Find Your Nearest Branch
        </h1>
        <p className="mb-12 max-w-2xl text-base leading-7 text-gray-600">
          Visit any of our branches for the same warm service, fresh coffee, and
          comfortable experience.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {branches.map((branch) => (
            <div key={branch.name} className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">{branch.name}</h2>
              <p className="mb-2 text-sm text-gray-600">{branch.address}</p>
              <p className="text-sm font-medium">Hours: {branch.hours}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageWrapper>
  );
}