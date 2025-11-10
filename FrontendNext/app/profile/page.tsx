"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { Loader2 } from "lucide-react";

const NEXT_PUBLIC_BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";

interface User {
  id: number;
  username: string;
  email: string;
}

const ProfilePage: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8 text-center">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-3" />
            <p>Loading profile...</p>
          </div>
        )}

        {/* Not Logged In State */}
        {!loading && !user && (
          <div className="py-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You need to log in to view your profile.
            </p>
            <a
              href="/auth/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-transform transform hover:scale-105"
            >
              Go to Login
            </a>
          </div>
        )}

        {/* Logged In State */}
        {!loading && user && (
          <div>
            <div className="flex flex-col items-center">
              {/* Avatar Placeholder */}
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-semibold mb-4">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                {user.username}
              </h2>
              <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            </div>

            {/* Profile Info Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-3 shadow-inner">
              <p className="text-sm text-gray-700">
                <strong className="font-semibold text-gray-900">
                  User ID:
                </strong>{" "}
                {user.id}
              </p>
              <p className="text-sm text-gray-700">
                <strong className="font-semibold text-gray-900">
                  Username:
                </strong>{" "}
                {user.username}
              </p>
              <p className="text-sm text-gray-700">
                <strong className="font-semibold text-gray-900">
                  Email:
                </strong>{" "}
                {user.email}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <a
                href="/settings"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-sm"
              >
                Edit Profile
              </a>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
