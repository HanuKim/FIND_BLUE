import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "remotion",
    "@remotion/player",
    "@remotion/cli",
  ],
};

export default nextConfig;
