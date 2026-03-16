"use client";

import { useEffect } from "react";

// next-pwa (register: true in next.config.ts) handles SW registration automatically.
// This component just logs the active registration for debugging.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => console.log("[SW] Active:", reg.scope))
        .catch((err) => console.error("[SW] Not ready:", err));
    }
  }, []);

  return null;
}
