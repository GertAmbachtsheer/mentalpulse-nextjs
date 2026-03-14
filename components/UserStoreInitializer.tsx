"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUserStore } from "@/store/userStore";

export default function UserStoreInitializer() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const setRole = useUserStore((s) => s.setRole);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) return;

    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => setRole(data.role ?? "user"))
      .catch(() => setRole("user"));
  }, [isLoaded, isSignedIn, userId, setRole]);

  return null;
}
