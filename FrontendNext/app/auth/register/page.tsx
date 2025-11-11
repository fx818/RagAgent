"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const NEXT_PUBLIC_BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://52.66.141.120:3001";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      alert(`Error submitting the form: ${error}`);
      console.error(error);
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
            Create Your Account
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed text-center md:text-left max-w-md">
            Join the Gemini-based workspace and experience intelligent
            document search, summarization, and analysis.
          </p>

          {/* ✅ Working Unsplash Illustration */}
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=80"
              alt="Registration Illustration"
              width={500}
              height={400}
              className="object-cover rounded-xl"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Right Register Form Section */}
        <div className="md:w-1/2 flex flex-col justify-center items-center p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-xl p-6 flex flex-col gap-5 border border-gray-200 shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
              Register
            </h2>
            <p className="text-gray-600 text-center mb-4 text-sm">
              Fill in your details to get started.
            </p>

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

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
              {loading ? "Registering..." : "Register"}
            </button>

            <div className="text-center mt-4 text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="/auth/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Login
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
