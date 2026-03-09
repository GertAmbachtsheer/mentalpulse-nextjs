"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { EmailCodeFactor } from "@clerk/types";

export default function CustomSignIn({ onToggle }: { onToggle?: () => void }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [showEmailCode, setShowEmailCode] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  // Reset password states
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showResetCodeStep, setShowResetCodeStep] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail,
      });
      setShowResetCodeStep(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        setResetSuccess(true);
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        setError("Password reset failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setShowResetCodeStep(false);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setError("");
    setResetSuccess(false);
  };

  // Handle the submission of the sign-in form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      // If sign-in process is complete, set the created session as active
      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              return;
            }
            router.push("/");
          },
        });
      } else if (signInAttempt.status === "needs_second_factor") {
        // Check if email_code is a valid second factor
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setShowEmailCode(true);
        }
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Sign-in failed. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(
        err.errors?.[0]?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the submission of the email verification code
  const handleEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setIsLoading(true);

    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              return;
            }
            router.push("/");
          },
        });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(
        err.errors?.[0]?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Display email code verification form
  if (showEmailCode) {
    return (
      <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        
        <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
           <div className="flex items-center p-4 pb-2 justify-between">
              <div className="w-12"></div>
              <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Verification</h2>
              <div className="flex w-12 items-center justify-end"></div>
           </div>
           
           <div className="px-6 pt-6 pb-2 mt-8">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">Verify Email</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
                 A verification code has been sent to your email.
              </p>
           </div>
           
           <form onSubmit={handleEmailCode} className="flex flex-col gap-4 px-6 py-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm mb-4">
                  {error}
                </div>
              )}
              
              <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Verification Code</span>
                  <input 
                    onChange={(e) => setCode(e.target.value)}
                    value={code}
                    disabled={isLoading}
                    type="text" 
                    inputMode="numeric"
                    required
                    className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 px-4 text-center tracking-widest text-2xl font-mono transition-all disabled:opacity-50" 
                    placeholder="000000" 
                  />
              </label>

              <button disabled={isLoading} type="submit" className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? "Verifying..." : "Verify Code"}
              </button>
           </form>
        </div>
      </div>
    );
  }

  // Display forgot password - enter email step
  if (showForgotPassword && !showResetCodeStep) {
    return (
      <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
          <div className="flex items-center p-4 pb-2 justify-between">
            <button onClick={resetForgotPasswordState} className="w-12 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Reset Password</h2>
            <div className="w-12"></div>
          </div>
          <div className="px-6 pt-6 pb-2 mt-8">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">Forgot Password?</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
              Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>
          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4 px-6 py-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  onChange={(e) => setResetEmail(e.target.value)}
                  value={resetEmail}
                  disabled={isLoading}
                  required
                  className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 pl-11 pr-4 text-base font-normal leading-normal transition-all disabled:opacity-50"
                  placeholder="you@example.com"
                  type="email"
                />
              </div>
            </label>
            <button disabled={isLoading} type="submit" className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Display forgot password - enter code + new password step
  if (showForgotPassword && showResetCodeStep) {
    return (
      <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
          <div className="flex items-center p-4 pb-2 justify-between">
            <button onClick={() => setShowResetCodeStep(false)} className="w-12 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">New Password</h2>
            <div className="w-12"></div>
          </div>
          <div className="px-6 pt-6 pb-2 mt-8">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">Check Your Email</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
              Enter the code sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{resetEmail}</span> and choose a new password.
            </p>
          </div>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4 px-6 py-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Reset Code</span>
              <input
                onChange={(e) => setResetCode(e.target.value)}
                value={resetCode}
                disabled={isLoading}
                type="text"
                inputMode="numeric"
                required
                className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 px-4 text-center tracking-widest text-2xl font-mono transition-all disabled:opacity-50"
                placeholder="000000"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">New Password</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  onChange={(e) => setNewPassword(e.target.value)}
                  value={newPassword}
                  disabled={isLoading}
                  required
                  className="flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-[#2b6cee]/20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-[#2b6cee] h-14 pl-11 pr-12 text-base font-normal leading-normal transition-all disabled:opacity-50"
                  placeholder="New password"
                  type={showNewPassword ? "text" : "password"}
                />
                <button onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2b6cee] transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px]">{showNewPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </label>
            <button disabled={isLoading} type="submit" className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Display sign-in form
  return (
    <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="relative flex h-[100dvh] min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-[#101622] shadow-xl">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="w-12"></div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Login</h2>
          <div className="flex w-12 items-center justify-end">
            <button className="text-[#2b6cee] hover:text-[#2b6cee]/80 text-base font-bold leading-normal tracking-[0.015em] shrink-0 transition-colors">
              Help
            </button>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
            Sign in to track your mood and find peace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}
          <label className="flex flex-col gap-1.5">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</span>
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
                  placeholder="you@example.com" 
                  type="email" 
                />
             </div>
          </label>

          <label className="flex flex-col gap-1.5">
             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</span>
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
                <button onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2b6cee] transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
             </div>
          </label>
          <div className="flex justify-end pt-1">
             <button type="button" onClick={() => { setError(""); setShowForgotPassword(true); }} className="text-sm font-semibold text-[#2b6cee] hover:text-[#2b6cee]/80 transition-colors">
                 Forgot Password?
             </button>
          </div>

          <button disabled={isLoading} type="submit" className="mt-6 w-full h-14 bg-[#2b6cee] hover:bg-[#2b6cee]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#2b6cee]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
             {isLoading ? (
                <span>Signing in...</span>
             ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
             )}
          </button>
        </form>

        <div className="mt-auto px-6 py-8 text-center bg-slate-50 dark:bg-slate-800/30">
           <p className="text-slate-600 dark:text-slate-400 text-base">
               Don't have an account? 
               {onToggle ? (
                 <button onClick={onToggle} type="button" className="font-bold text-[#2b6cee] hover:text-[#2b6cee]/80 ml-1 whitespace-nowrap">Sign Up</button>
               ) : (
                 <a className="font-bold text-[#2b6cee] hover:text-[#2b6cee]/80 ml-1 whitespace-nowrap" href="/sign-up">Sign Up</a>
               )}
           </p>
        </div>
      </div>
    </div>
  );
}
