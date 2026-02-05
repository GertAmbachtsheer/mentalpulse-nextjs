import type { NextConfig } from "next";
import withPWAInit  from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

const pwaConfig = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
