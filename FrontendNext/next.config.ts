import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Allow popular image CDNs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.dribbble.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.svgrepo.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
