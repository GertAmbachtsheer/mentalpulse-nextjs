"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  finalizeSignInNavigate,
  prepareSignInSecondFactor,
  verifySignInSecondFactor,
  type SecondFactorKind,
} from "@/lib/clerk-sign-in-second-factor";
import { clerkErrorFirstMessage } from "@/lib/clerk-error-message";

export default function CustomSignIn({ onToggle }: { onToggle?: () => void }) {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [mfaKind, setMfaKind] = React.useState<SecondFactorKind | null>(null);
  const router = useRouter();

  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showResetCodeStep, setShowResetCodeStep] = React.useState(false);

  const needsSecondStep =
    signIn?.status === "needs_second_factor" ||
    signIn?.status === "needs_client_trust";

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setIsLoading(true);
    try {
      await signIn.reset();
      const { error: createErr } = await signIn.create({
        identifier: resetEmail,
      });
      if (createErr) {
        setError(
          clerkErrorFirstMessage(createErr) ??
            "Could not start password reset. Try again."
        );
        return;
      }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendErr) {
        setError(
          clerkErrorFirstMessage(sendErr) ?? "Could not send reset code."
        );
        return;
      }
      setShowResetCodeStep(true);
    } catch (err: unknown) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setIsLoading(true);
    try {
      if (signIn.status === "needs_new_password") {
        const { error: pErr } =
          await signIn.resetPasswordEmailCode.submitPassword({
            password: newPassword,
          });
        if (pErr) {
          setError(
            clerkErrorFirstMessage(pErr) ?? "Could not set password."
          );
          return;
        }
        const fin = await finalizeSignInNavigate(signIn, router, "/");
        if (fin.error) {
          setError(
            clerkErrorFirstMessage(fin.error) ??
              "Could not complete sign-in."
          );
        }
      } else {
        const { error: vErr } =
          await signIn.resetPasswordEmailCode.verifyCode({
            code: resetCode,
          });
        if (vErr) {
          setError(clerkErrorFirstMessage(vErr) ?? "Invalid code.");
          return;
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPasswordState = async () => {
    if (signIn) await signIn.reset();
    setShowForgotPassword(false);
    setShowResetCodeStep(false);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
            "Sign-in failed. Please check your credentials."
        );
        return;
      }

      if (signIn.status === "complete") {
        const fin = await finalizeSignInNavigate(signIn, router, "/");
        if (fin.error) {
          setError(
            clerkErrorFirstMessage(fin.error) ??
              "Could not complete sign-in."
          );
        }
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
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
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
        const fin = await finalizeSignInNavigate(signIn, router, "/");
        if (fin.error) {
          setError(
            clerkErrorFirstMessage(fin.error) ??
              "Could not complete sign-in."
          );
        }
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
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

  const secondFactorTitle =
    mfaKind === "phone_code"
      ? "Verify phone"
      : mfaKind === "totp"
        ? "Authenticator code"
        : mfaKind === "backup_code"
          ? "Backup code"
          : "Verify email";

  const secondFactorHint =
    mfaKind === "phone_code"
      ? "A verification code was sent to your phone number on file."
      : mfaKind === "totp"
        ? "Enter the code from your authenticator app."
        : mfaKind === "backup_code"
          ? "Enter one of your backup codes."
          : signIn?.status === "needs_client_trust"
            ? "We sent a code to verify this new device."
            : "Enter the verification code sent to your email.";

  if (needsSecondStep && mfaKind) {
    return (
      <div
        className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans"
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

        <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
          <div className="flex items-center p-4 pb-2 justify-between">
            <div className="w-12" />
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              Verification
            </h2>
            <div className="flex w-12 items-center justify-end" />
          </div>

          <div className="px-6 pt-6 pb-2 mt-8">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">
              {secondFactorTitle}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
              {secondFactorHint}
            </p>
          </div>

          <form
            onSubmit={handleSecondFactorSubmit}
            className="flex flex-col gap-4 px-6 py-8"
          >
            {(error || errors.fields.code) && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm mb-4">
                {error || errors.fields.code?.message}
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {mfaKind === "backup_code" ? "Backup code" : "Verification code"}
              </span>
              <input
                onChange={(e) => setCode(e.target.value)}
                value={code}
                disabled={isLoading || fetchStatus === "fetching"}
                type="text"
                inputMode={
                  mfaKind === "backup_code" ? "text" : "numeric"
                }
                required
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
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Start over
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgotPassword && !showResetCodeStep) {
    return (
      <div
        className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans"
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
        <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
          <div className="flex items-center p-4 pb-2 justify-between">
            <button
              onClick={() => void resetForgotPasswordState()}
              className="w-12 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">
                arrow_back
              </span>
            </button>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              Reset Password
            </h2>
            <div className="w-12" />
          </div>
          <div className="px-6 pt-6 pb-2 mt-8">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">
              Forgot Password?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
              Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>
          <form
            onSubmit={handleForgotPasswordSubmit}
            className="flex flex-col gap-4 px-6 py-8"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Email Address
              </span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">
                    mail
                  </span>
                </div>
                <input
                  onChange={(e) => setResetEmail(e.target.value)}
                  value={resetEmail}
                  disabled={isLoading || fetchStatus === "fetching"}
                  required
                  className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 pl-11 pr-4 text-base font-normal leading-normal transition-all disabled:opacity-50"
                  placeholder="you@example.com"
                  type="email"
                />
              </div>
            </label>
            <button
              disabled={isLoading || fetchStatus === "fetching"}
              type="submit"
              className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgotPassword && showResetCodeStep) {
    const onNewPasswordStep = signIn?.status === "needs_new_password";
    return (
      <div
        className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans"
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
        <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
          <div className="flex items-center p-4 pb-2 justify-between">
            <button
              onClick={() => {
                if (onNewPasswordStep && signIn) {
                  void signIn.reset();
                  setShowResetCodeStep(false);
                  setResetCode("");
                  setNewPassword("");
                  setError("");
                } else {
                  setShowResetCodeStep(false);
                }
              }}
              className="w-12 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">
                arrow_back
              </span>
            </button>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              {onNewPasswordStep ? "New Password" : "Check your email"}
            </h2>
            <div className="w-12" />
          </div>
          <div className="px-6 pt-6 pb-2 mt-8">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">
              {onNewPasswordStep ? "Choose a new password" : "Enter reset code"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
              {onNewPasswordStep ? (
                "Your code was verified. Set a new password below."
              ) : (
                <>
                  Enter the code sent to{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {resetEmail}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
          <form
            onSubmit={handleResetFlowSubmit}
            className="flex flex-col gap-4 px-6 py-8"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}
            {!onNewPasswordStep && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Reset Code
                </span>
                <input
                  onChange={(e) => setResetCode(e.target.value)}
                  value={resetCode}
                  disabled={isLoading || fetchStatus === "fetching"}
                  type="text"
                  inputMode="numeric"
                  required
                  className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 px-4 text-center tracking-widest text-2xl font-mono transition-all disabled:opacity-50"
                  placeholder="000000"
                />
              </label>
            )}
            {onNewPasswordStep && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  New Password
                </span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      lock
                    </span>
                  </div>
                  <input
                    onChange={(e) => setNewPassword(e.target.value)}
                    value={newPassword}
                    disabled={isLoading || fetchStatus === "fetching"}
                    required
                    className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 pl-11 pr-12 text-base font-normal leading-normal transition-all disabled:opacity-50"
                    placeholder="New password"
                    type={showNewPassword ? "text" : "password"}
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2b6cee] transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNewPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </label>
            )}
            <button
              disabled={isLoading || fetchStatus === "fetching"}
              type="submit"
              className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading
                ? "Please wait..."
                : onNewPasswordStep
                  ? "Save password"
                  : "Verify code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans"
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

      <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="w-12" />
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Login
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button
              className="text-[#2b6cee] hover:text-[#2b6cee]/80 text-base font-bold leading-normal tracking-[0.015em] shrink-0 transition-colors"
              type="button"
            >
              Help
            </button>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
            Sign in to track your mood and find peace
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
              Email Address
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
                placeholder="you@example.com"
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
                onClick={() => setShowPassword(!showPassword)}
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
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowForgotPassword(true);
              }}
              className="text-sm font-semibold text-[#2b6cee] hover:text-[#2b6cee]/80 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            disabled={isLoading || fetchStatus === "fetching"}
            type="submit"
            className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading || fetchStatus === "fetching" ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <div className="mt-auto px-6 py-8 text-center bg-slate-50 dark:bg-slate-800/30">
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Don&apos;t have an account?
            {onToggle ? (
              <button
                onClick={onToggle}
                type="button"
                className="font-bold text-[#2b6cee] hover:text-[#2b6cee]/80 ml-1 whitespace-nowrap"
              >
                Sign Up
              </button>
            ) : (
              <a
                className="font-bold text-[#2b6cee] hover:text-[#2b6cee]/80 ml-1 whitespace-nowrap"
                href="/sign-up"
              >
                Sign Up
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
