"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  prepareSignInSecondFactor,
  verifySignInSecondFactor,
  type SecondFactorKind,
} from "@/lib/clerk-sign-in-second-factor";
import { clerkErrorFirstMessage } from "@/lib/clerk-error-message";

export default function AdminLoginPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mfaKind, setMfaKind] = useState<SecondFactorKind | null>(null);
  const [code, setCode] = useState("");

  const needsSecondStep =
    signIn?.status === "needs_second_factor" ||
    signIn?.status === "needs_client_trust";

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/admin");
    }
  }, [isSignedIn, router]);

  async function finalizeAdminSignIn() {
    if (!signIn) return;
    const fin = await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return;
        }
        const roleRes = await fetch("/api/user/role");
        if (!roleRes.ok) {
          setError("Unable to verify admin role.");
          return;
        }
        const roleData = await roleRes.json();
        if (roleData.role !== "admin") {
          setError("You do not have admin access.");
          return;
        }
        const url = decorateUrl("/admin");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.replace(url);
        }
      },
    });
    if (fin.error) {
      setError(
        clerkErrorFirstMessage(fin.error) ??
          "Could not complete admin sign-in."
      );
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signIn) return;

    setError("");
    setIsLoading(true);
    setMfaKind(null);

    try {
      const { error: pwErr } = await signIn.password({
        emailAddress: email,
        password,
      });
      if (pwErr) {
        setError(
          clerkErrorFirstMessage(pwErr) ??
            "Admin login failed. Please check your credentials."
        );
        return;
      }

      if (signIn.status === "complete") {
        await finalizeAdminSignIn();
        return;
      }

      if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        const prep = await prepareSignInSecondFactor(signIn);
        if (!prep.ok) {
          await signIn.reset();
          setError(prep.message);
          return;
        }
        setMfaKind(prep.kind);
        setCode("");
        return;
      }

      setError("Sign-in could not be completed. Please try again.");
    } catch {
      setError("Admin login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (!signIn || !mfaKind) return;

    setError("");
    setIsLoading(true);

    try {
      const { error: vErr } = await verifySignInSecondFactor(
        signIn,
        mfaKind,
        code
      );
      if (vErr) {
        setError(
          clerkErrorFirstMessage(vErr) ?? "Verification failed. Try again."
        );
        return;
      }

      if (signIn.status === "complete") {
        await finalizeAdminSignIn();
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendSecondFactorCode = async () => {
    if (!signIn || !mfaKind) return;
    setError("");
    setIsLoading(true);
    try {
      if (mfaKind === "email_code") {
        const { error: err } = await signIn.mfa.sendEmailCode();
        if (err) {
          setError(clerkErrorFirstMessage(err) ?? "Could not resend code.");
        }
      } else if (mfaKind === "phone_code") {
        const { error: err } = await signIn.mfa.sendPhoneCode();
        if (err) {
          setError(clerkErrorFirstMessage(err) ?? "Could not resend code.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startOverSecondFactor = async () => {
    if (!signIn) return;
    setError("");
    setMfaKind(null);
    setCode("");
    await signIn.reset();
  };

  if (needsSecondStep && mfaKind) {
    const title =
      mfaKind === "phone_code"
        ? "Verify phone"
        : mfaKind === "totp"
          ? "Authenticator code"
          : mfaKind === "backup_code"
            ? "Backup code"
            : "Verify email";
    const hint =
      mfaKind === "phone_code"
        ? "A code was sent to your phone number on file."
        : mfaKind === "totp"
          ? "Enter the code from your authenticator app."
          : mfaKind === "backup_code"
            ? "Enter one of your backup codes."
            : signIn?.status === "needs_client_trust"
              ? "New device verification."
              : "Enter the code sent to your email.";

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
              Admin verification
            </h2>
            <div className="w-12" />
          </div>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">
              {title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
              {hint}
            </p>
          </div>

          <form
            onSubmit={handleSecondFactor}
            className="flex flex-col gap-4 px-6 py-8"
          >
            {(error || errors.fields.code) && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
                {error || errors.fields.code?.message}
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading || fetchStatus === "fetching"}
                required
                type="text"
                inputMode={
                  mfaKind === "backup_code" ? "text" : "numeric"
                }
                autoComplete="one-time-code"
                className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 px-4 text-center tracking-widest text-2xl font-mono transition-all disabled:opacity-50"
                placeholder={mfaKind === "backup_code" ? "••••••••" : "000000"}
              />
            </label>

            <button
              disabled={isLoading || fetchStatus === "fetching"}
              type="submit"
              className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading || fetchStatus === "fetching"
                ? "Verifying..."
                : "Verify"}
            </button>

            {(mfaKind === "email_code" || mfaKind === "phone_code") && (
              <button
                type="button"
                onClick={() => void resendSecondFactorCode()}
                disabled={isLoading || fetchStatus === "fetching"}
                className="text-sm font-semibold text-[#2b6cee] hover:text-[#2b6cee]/80 disabled:opacity-50"
              >
                Resend code
              </button>
            )}

            <button
              type="button"
              onClick={() => void startOverSecondFactor()}
              className="text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              Start over
            </button>
          </form>
        </div>
      </div>
    );
  }

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
          {(error ||
            errors.fields.identifier ||
            errors.fields.password) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
              {error ||
                errors.fields.identifier?.message ||
                errors.fields.password?.message}
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Admin Email
            </span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </div>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                disabled={isLoading || fetchStatus === "fetching"}
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
                <span className="material-symbols-outlined text-[20px]">
                  lock
                </span>
              </div>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                disabled={isLoading || fetchStatus === "fetching"}
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
            disabled={isLoading || fetchStatus === "fetching"}
            type="submit"
            className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading || fetchStatus === "fetching" ? (
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
