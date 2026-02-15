import type { NextConfig } from "next";
import withPWAInit  from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

const pwaConfig = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
});

export default pwaConfig(nextConfig);
// import type { NextConfig } from "next";

// const NextConfig = {
//   output: 'standalone',
//   /* config options here */
// };

// export default NextConfig;

