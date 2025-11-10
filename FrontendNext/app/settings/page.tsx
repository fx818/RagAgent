"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

const NEXT_PUBLIC_BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";

// ✅ Reusable Input Field Component
type InputFieldProps = {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  helpText?: string;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  helpText,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`block w-full rounded-md border ${
        disabled ? "bg-gray-100 text-gray-400" : "bg-white text-gray-900"
      } border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition sm:text-sm sm:leading-6`}
    />
    {helpText && (
      <p className="mt-2 text-xs text-gray-500">{helpText}</p>
    )}
  </div>
);

// ✅ Main Settings Page
const SettingsPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/getme`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Authentication failed. Please log in again.");
        }

        const data = await res.json();
        setUsername(data.user.username);
        setEmail(data.user.email);
        setAuthenticated(true);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data.");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Update settings
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    const updateData: { username?: string; password?: string } = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed.");

      setSuccess("✅ Settings updated successfully!");
      setPassword("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-10 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Settings</h1>
        <p className="text-sm text-gray-500 mb-8">
          Manage your account information and update your credentials below.
        </p>

        {/* Loader */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Not Authenticated */}
        {!loading && !authenticated && (
          <div className="flex flex-col items-center justify-center h-48">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-gray-600 text-center text-sm">
              You must be logged in to view this page.
            </p>
            <a
              href="/auth/login"
              className="mt-4 text-blue-600 font-medium hover:underline"
            >
              Go to Login
            </a>
          </div>
        )}

        {/* Authenticated User */}
        {!loading && authenticated && (
          <form onSubmit={handleSubmit}>
            {/* Profile Section */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Update your display name or view your registered email.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="Username"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
                <InputField
                  label="Email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={() => {}}
                  placeholder="Email"
                  disabled
                  helpText="Email cannot be changed."
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Security
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Update your password below.
              </p>

              <InputField
                label="New Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                helpText="Leave blank to keep your current password."
              />
            </div>

            {/* Feedback */}
            <div className="mt-6 space-y-3">
              {error && (
                <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 rounded-md bg-green-50 p-4 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className={`flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
