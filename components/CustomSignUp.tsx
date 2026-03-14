"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function CustomSignUp({ onToggle }: { onToggle?: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const router = useRouter();

  // Handle submission of the sign-up form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setIsLoading(true);

    try {
      // Start the sign-up process using the email, password, name, and phone provided
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          phoneNumber,
          role: "user"
        }
      });

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      // Set 'verifying' true to display verification form
      setVerifying(true);
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the submission of the verification form
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setIsLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      if (signUpAttempt.status === "complete") {
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              return;
            }
            try {
              await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firstName,
                  lastName,
                  phoneNumber,
                }),
              });
            } catch (err) {
              console.error("Failed to persist user profile to Supabase", err);
              // Do not block navigation if this fails.
            }
            router.push("/");
          },
        });
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Display email verification form
  if (verifying) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        
        <div className="relative flex h-dvh min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-background-dark shadow-xl">
           <div className="flex items-center p-4 pb-2 justify-between">
              <div className="w-12"></div>
              <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Verification</h2>
              <div className="flex w-12 items-center justify-end"></div>
           </div>
           
           <div className="px-6 pt-6 pb-2 mt-8">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white text-center mb-2">Verify Email</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-normal text-center">
                 Enter the verification code sent to your email.
              </p>
           </div>
           
           <form onSubmit={handleVerify} className="flex flex-col gap-4 px-6 py-8">
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

  // Display sign-up form
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="relative flex h-dvh min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-background-dark shadow-xl">
        <div className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-white/90 dark:bg-background-dark/90 backdrop-blur-sm z-10">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12 text-slate-900 dark:text-slate-100">Sign Up</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h1 className="text-3xl font-bold leading-tight px-6 text-left pb-3 pt-6 text-slate-900 dark:text-slate-100">Create an account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal pb-6 px-6">Start your journey to better mental health today.</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">First Name</label>
                <div className="relative">
                  <input required disabled={isLoading} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#2b6cee] focus:ring-1 focus:ring-[#2b6cee] focus:outline-none h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal transition-all disabled:opacity-50" placeholder="Alex" type="text" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">Last Name</label>
                <div className="relative">
                  <input required disabled={isLoading} value={lastName} onChange={(e) => setLastName(e.target.value)} className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#2b6cee] focus:ring-1 focus:ring-[#2b6cee] focus:outline-none h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal transition-all disabled:opacity-50" placeholder="Johnson" type="text" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">
                Contact Number
              </label>
              <div className="relative">
                <input
                  required
                  disabled={isLoading}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#2b6cee] focus:ring-1 focus:ring-[#2b6cee] focus:outline-none h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal transition-all disabled:opacity-50"
                  placeholder="123 456 7890"
                  type="tel"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">Email</label>
              <div className="relative">
                <input required disabled={isLoading} value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#2b6cee] focus:ring-1 focus:ring-[#2b6cee] focus:outline-none h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal transition-all disabled:opacity-50" placeholder="e.g. alex@example.com" type="email" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">Password</label>
              <div className="relative">
                <input required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#2b6cee] focus:ring-1 focus:ring-[#2b6cee] focus:outline-none h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal transition-all disabled:opacity-50" placeholder="Must be at least 8 characters" type={showPassword ? "text" : "password"} />
                <button onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2b6cee] transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 py-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input required className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-[#2b6cee] checked:border-[#2b6cee] transition-all focus:ring-2 focus:ring-[#2b6cee]/20 focus:outline-none" type="checkbox" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400 pt-0.5 select-none">I agree to the <a className="text-[#2b6cee] font-medium hover:underline" href="#">Terms of Service</a> and <a className="text-[#2b6cee] font-medium hover:underline" href="#">Privacy Policy</a></span>
            </label>

            <div id="clerk-captcha" />

            <button disabled={isLoading} type="submit" className="mt-4 flex w-full items-center justify-center rounded-full bg-[#2b6cee] py-4 px-6 text-base font-bold text-white shadow-lg shadow-[#2b6cee]/30 transition-all hover:bg-[#2b6cee]/90 hover:shadow-[#2b6cee]/40 active:scale-[0.98] disabled:opacity-50">
               {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <div className="p-8 text-center bg-slate-50 dark:bg-background-dark/50 border-t border-slate-100 dark:border-slate-800">
          <p className="text-base text-slate-600 dark:text-slate-400">
            Already have an account? 
            {onToggle ? (
              <button type="button" onClick={onToggle} className="font-bold text-[#2b6cee] hover:text-[#2b6cee]/80 transition-colors ml-1">Log in</button>
            ) : (
              <a className="font-bold text-[#2b6cee] hover:text-[#2b6cee]/80 transition-colors ml-1" href="/sign-in">Log in</a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
