import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow IPFS gateway previews; keep flexible via remotePatterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
    ],
  },
};

export default nextConfig;
