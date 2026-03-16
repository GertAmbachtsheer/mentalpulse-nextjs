"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    fetch("/api/user/role")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (data.role !== "admin") {
          router.replace("/admin/login");
        } else {
          setVerified(true);
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  if (!verified) {
    return <Loading />;
  }

  return <>{children}</>;
}
