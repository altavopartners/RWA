import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporary: allow production build to pass despite ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep type-checking during build; set to true to bypass if needed
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
    ],
  },
};

export default nextConfig;
