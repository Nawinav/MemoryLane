import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "100mb"
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
