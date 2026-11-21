import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server from other devices on the home network
  // (e.g. http://192.168.2.14:3000). Dev-only; has no effect in production.
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
