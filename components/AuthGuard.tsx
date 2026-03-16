"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    fetch("/api/auth/verify")
      .then((res) => {
        if (!res.ok) {
          router.replace("/");
        } else {
          setVerified(true);
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  if (!verified) {
    return <Loading />;
  }

  return <>{children}</>;
}
