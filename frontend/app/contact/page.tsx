// frontend/app/contact/page.tsx

// Import the reusable public wrapper
import PublicPageWrapper from "@/components/public-page-wrapper";

// Contact page
export default function ContactPage() {
  return (
    <PublicPageWrapper>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Left side: contact information */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Contact Us
            </p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight">
              We would love to hear from you
            </h1>
            <p className="mb-8 text-base leading-7 text-gray-600">
              Reach out for branch inquiries, menu questions, promo details, or
              general concerns.
            </p>

            <div className="space-y-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Email:</span> hello@loydcoffee.com
              </p>
              <p>
                <span className="font-semibold">Phone:</span> +63 912 345 6789
              </p>
              <p>
                <span className="font-semibold">Business Hours:</span> 8:00 AM - 9:00 PM
              </p>
            </div>
          </div>

          {/* Right side: simple inquiry form */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">Send an Inquiry</h2>

            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-md border px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-md border px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Message</label>
                <textarea
                  rows={5}
                  placeholder="Write your message here"
                  className="w-full rounded-md border px-3 py-2 outline-none"
                />
              </div>

              <button
                type="submit"
                className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </PublicPageWrapper>
  );
}