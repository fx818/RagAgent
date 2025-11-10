// "use client"; // Keep this as a Server Component

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gemini based File Search",
  description: "Created by Anurag Upadhyay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Make <html> full-height
    <html lang="en" className="h-full bg-gray-50">
      <body
        // Full-height layout + light theme
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-gray-800 h-full overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Navbar */}
          <nav className="bg-white w-full px-6 h-16 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <a href="/" className="text-xl font-semibold text-gray-900">
              Gemini based File Search
            </a>
            <ul className="flex items-center gap-6">
              <li>
                <a
                  href="/settings"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Settings
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Profile
                </a>
              </li>
            </ul>
          </nav>

          {/* Body: Sidebar + Main Content */}
          <div className="flex flex-1 overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <aside className="bg-white w-64 p-4 border-r border-gray-200 overflow-y-auto shadow-sm">
              <nav>
                <ul className="flex flex-col gap-2">
                  <li>
                    <a
                      href="/"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
                    >
                      Home
                    </a>
                  </li>

                  {/* Account Section */}
                  <li className="px-3 text-xs font-semibold text-gray-500 uppercase mt-4">
                    Account
                  </li>
                  <li>
                    <a
                      href="/profile"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
                    >
                      Profile
                    </a>
                  </li>
                  <li>
                    <a
                      href="/settings"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
                    >
                      Settings
                    </a>
                  </li>

                  {/* File Storage */}
                  <li className="px-3 text-xs font-semibold text-gray-500 uppercase mt-4">
                    File Storage
                  </li>
                  <li>
                    <a
                      href="/upload"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
                    >
                      Upload File
                    </a>
                  </li>

                  {/* RAG Section */}
                  <li className="px-3 text-xs font-semibold text-gray-500 uppercase mt-4">
                    RAG
                  </li>
                  <li>
                    <a
                      href="/chat"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900"
                    >
                      Chat
                    </a>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden bg-gray-50">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
