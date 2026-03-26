import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-ac0fdf282208481fa692b64c2fba1e93.r2.dev",
      },
    ],
  },
};

export default nextConfig;
