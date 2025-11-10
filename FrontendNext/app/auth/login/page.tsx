"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const NEXT_PUBLIC_BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        router.push("/profile");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans px-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration Section */}
        <div className="md:w-1/2 bg-gray-50 flex flex-col justify-center items-center p-10 border-b md:border-b-0 md:border-r border-gray-200">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center md:text-left">
            Welcome Back
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed text-center md:text-left max-w-md">
            Sign in to your intelligent document dashboard — analyze, explore,
            and chat with your data instantly.
          </p>

          {/*  ✅ Working Unsplash Illustration */}
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80"
              alt="Login Illustration"
              width={500}
              height={400}
              className="object-cover rounded-xl"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Right Login Form Section */}
        <div className="md:w-1/2 flex flex-col justify-center items-center p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-xl p-6 flex flex-col gap-5 border border-gray-200 shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
              Sign In
            </h2>
            <p className="text-gray-600 text-center mb-4 text-sm">
              Access your Gemini-based workspace.
            </p>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-4 text-sm text-gray-600">
              Don’t have an account?{" "}
              <a
                href="/auth/register"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Register
              </a>
            </div>
          </form>

          <p className="text-xs text-gray-400 mt-8">
            Powered by <span className="text-blue-600 font-medium">Gemini AI</span>
          </p>
        </div>
      </div>
    </div>
  );
}
