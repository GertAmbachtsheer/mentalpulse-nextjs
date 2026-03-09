"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUserStore } from "@/store/userStore";
import { useLocationStore } from "@/store/locationStore";

export default function UserStoreInitializer() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const setRole = useUserStore((s) => s.setRole);
  const initLocationForUser = useLocationStore((s) => s.initForUser);
  const resetLocation = useLocationStore((s) => s.reset);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      resetLocation();
      return;
    }

    initLocationForUser(userId);

    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => setRole(data.role ?? "user"))
      .catch(() => setRole("user"));
  }, [isLoaded, isSignedIn, userId, setRole, initLocationForUser, resetLocation]);

  return null;
}
