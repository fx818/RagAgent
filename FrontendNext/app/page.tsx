"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import Image from "next/image";

const DashboardPage: NextPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans px-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left Section */}
        <div className="md:w-1/2 flex flex-col justify-center items-start p-10 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200">
          

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Unlock Insights from Your Documents.
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed max-w-md">
            Your intelligent document assistant for extracting insights,
            summaries, and answers in seconds. Upload, chat, and analyze effortlessly.
          </p>

          {/* Working Illustration (Unsplash) */}
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=800&q=80"
              alt="AI Insights Illustration"
              width={500}
              height={400}
              className="object-cover rounded-xl"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-1/2 flex flex-col justify-center items-center p-10">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Welcome to Your Dashboard
            </h2>
            <p className="text-gray-600 mb-8">
              Access your intelligent workspace — powered by Gemini AI.
            </p>

            {isLoggedIn ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="/upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  Upload Documents
                </a>
                <a
                  href="/chat"
                  className="border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  Chat with Agent
                </a>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="/auth/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  Login
                </a>
                <a
                  href="/auth/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  Register
                </a>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-10">
              Powered by <span className="text-blue-600 font-medium">Gemini AI</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
