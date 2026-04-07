// frontend/app/dashboard/logout-button.tsx

"use client";

// Router lets us move the user after logout
import { useRouter } from "next/navigation";

// Import the browser-side Supabase client
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    // Sign the user out
    await supabase.auth.signOut();

    // Refresh and go back to login
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md bg-black px-4 py-2 text-white"
    >
      Logout
    </button>
  );
}