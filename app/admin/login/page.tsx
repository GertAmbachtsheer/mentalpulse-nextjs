"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/admin");
    }
  }, [isSignedIn, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setError("");
    setIsLoading(true);

    try {
      const attempt = await signIn.create({
        identifier: email,
        password,
      });

      if (attempt.status !== "complete") {
        setError("Additional verification is required. Please use the regular login.");
        setIsLoading(false);
        return;
      }

      await setActive({ session: attempt.createdSessionId });

      // After signing in, verify admin role via backend
      const roleRes = await fetch("/api/user/role");
      if (!roleRes.ok) {
        setError("Unable to verify admin role.");
        setIsLoading(false);
        return;
      }
      const roleData = await roleRes.json();

      if (roleData.role !== "admin") {
        setError("You do not have admin access.");
        setIsLoading(false);
        return;
      }

      router.replace("/admin");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message ??
        "Admin login failed. Please check your credentials.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="relative flex h-dvh min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-background-dark shadow-xl">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="w-12" />
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Admin Login
          </h2>
          <div className="w-12" />
        </div>

        <div className="px-6 pt-6 pb-2">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">
            Welcome, Admin
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
            Sign in with your admin account to manage users.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Admin Email
            </span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                disabled={isLoading}
                required
                className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 pl-11 pr-4 text-base font-normal leading-normal transition-all disabled:opacity-50"
                placeholder="admin@example.com"
                type="email"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Password
            </span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                disabled={isLoading}
                required
                className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 pl-11 pr-12 text-base font-normal leading-normal transition-all disabled:opacity-50"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
              />
              <button
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2b6cee] transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
          </label>

          <button
            disabled={isLoading}
            type="submit"
            className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In as Admin</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <div className="mt-auto px-6 py-6 text-center bg-slate-50 dark:bg-slate-800/30">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            This area is restricted to authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}

