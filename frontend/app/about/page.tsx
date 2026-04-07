// frontend/app/about/page.tsx

// Import the reusable public wrapper
import PublicPageWrapper from "@/components/public-page-wrapper";

// About page
export default function AboutPage() {
  return (
    <PublicPageWrapper>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          About Us
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">Our Story</h1>

        <div className="space-y-6 text-base leading-8 text-gray-700">
          <p>
            Loyd Coffee Shop was created to give customers a simple and welcoming
            place for coffee, pastries, and quiet moments. We focus on making
            everyday coffee feel more personal, comfortable, and reliable.
          </p>

          <p>
            Across our branches, we aim to provide the same warm experience:
            fresh drinks, friendly service, and spaces where people can pause,
            work, study, or spend time with friends.
          </p>

          <p>
            Our goal is not only to serve good coffee, but also to build a
            coffee shop brand that customers return to because it feels familiar,
            steady, and worth coming back to.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <h2 className="mb-2 text-xl font-semibold">Mission</h2>
            <p className="text-sm leading-6 text-gray-600">
              To serve quality coffee and create welcoming spaces for everyday
              moments.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="mb-2 text-xl font-semibold">Vision</h2>
            <p className="text-sm leading-6 text-gray-600">
              To become a trusted local coffee shop brand known for consistency,
              comfort, and customer connection.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="mb-2 text-xl font-semibold">Values</h2>
            <p className="text-sm leading-6 text-gray-600">
              Quality, warmth, simplicity, and a better daily coffee experience.
            </p>
          </div>
        </div>
      </section>
    </PublicPageWrapper>
  );
}