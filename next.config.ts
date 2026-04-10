import path from "path";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    const supabaseEntry = path.resolve(__dirname, "lib/supabase.ts");
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string | false | string[]>),
      [supabaseEntry]: path.resolve(
        __dirname,
        isServer ? "lib/supabase-server.ts" : "lib/supabase-browser.ts"
      ),
    };
    return config;
  },
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
