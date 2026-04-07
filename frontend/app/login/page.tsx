"use client";

// Import React state so we can store input values
import { useState } from "react";

// Import the Supabase client we created
import { supabase } from "@/lib/supabase";

// Import useRouter so we can redirect after login
import { useRouter } from "next/navigation";

export default function LoginPage() {
  // Store the email typed by the user
  const [email, setEmail] = useState("");

  // Store the password typed by the user
  const [password, setPassword] = useState("");

  // Store loading state while logging in
  const [loading, setLoading] = useState(false);

  // Store error message if login fails
  const [error, setError] = useState("");

  // Router for redirecting to another page after success
  const router = useRouter();

  // This function runs when the form is submitted
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear old error message
    setError("");

    // Show loading state
    setLoading(true);

    // Try logging in with Supabase email and password auth
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Stop loading state
    setLoading(false);

    // If there is an error, show it
    if (error) {
      setError(error.message);
      return;
    }

    // If login is successful, go to the dashboard page
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Loyd Coffee Shop Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}