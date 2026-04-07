"use client";

// Import the browser-side Supabase client
import { createClient } from "@/lib/supabase/client";

// Import router so we can redirect after logout
import { useRouter } from "next/navigation";

// Create the logout button component
export default function LogoutButton() {
  // Create the Supabase browser client
  const supabase = createClient();

  // Router lets us move the user to another page
  const router = useRouter();

  // This function runs when the user clicks logout
  const handleLogout = async () => {
    // Sign the user out from Supabase
    await supabase.auth.signOut();

    // Send the user back to the login page
    router.push("/login");

    // Refresh the app so protected pages update correctly
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md bg-red-600 px-4 py-2 text-white"
    >
      Logout
    </button>
  );
}