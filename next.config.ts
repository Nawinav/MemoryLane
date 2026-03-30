import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb"
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
