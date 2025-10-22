import type { NextConfig } from "next";

const allowedDevOrigins = process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS.split(",").map((origin) =>
      origin.trim()
    )
  : [];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  ...(allowedDevOrigins.length > 0 && { allowedDevOrigins }),
};

export default nextConfig;
