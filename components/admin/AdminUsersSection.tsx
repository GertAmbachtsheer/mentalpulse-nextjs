"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  createdAt: number;
};

export function AdminUsersSection() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const load = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (res.status === 403) {
          await signOut();
          router.replace("/");
          return;
        }
        if (!res.ok) {
          setError("Failed to load users.");
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setUsers(data.users ?? []);
        setIsLoading(false);
      } catch {
        setError("Something went wrong while loading users.");
        setIsLoading(false);
      }
    };

    load();
  }, [isLoaded, isSignedIn, router, signOut]);

  return (
    <>
      <section className="mb-6 max-w-5xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">
          Overview
        </h3>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Users
            </p>
            {isLoading ? (
              <div className="h-7 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{users.length}</p>
            )}
          </div>
          <span className="material-symbols-outlined text-[32px] text-[#2b6cee]">
            group
          </span>
        </div>
      </section>

      <section className="mt-4 max-w-5xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3">
          Users
        </h3>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 w-32 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-2.5 w-44 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-2.5 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            No users found.
          </div>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                      : u.email ?? "Unknown user"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {u.email || "No email"}
                  </span>
                  {u.phoneNumber && (
                    <a
                      href={`tel:${u.phoneNumber}`}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                    >
                      {u.phoneNumber}
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                      u.role === "admin"
                        ? "bg-[#2b6cee]/10 text-[#2b6cee]"
                        : "bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ID: {u.id.slice(0, 6)}…
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
