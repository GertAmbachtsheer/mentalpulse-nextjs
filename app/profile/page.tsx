"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Suspense, useEffect, useState } from "react";
import Loading from "@/app/loading";
import { Toaster } from "@/components/ui/sonner";
import BottomNav from "@/components/BottomNav";
import ProfileLocationToggleCard from "@/components/ProfileLocationToggleCard";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Basic theme detection logic
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  };

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      {user ? (
        <div className="mx-auto w-full max-w-md bg-background-light dark:bg-background-dark flex flex-col relative shadow-2xl min-h-screen overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors -ml-2 text-text-main dark:text-white flex items-center justify-center">
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </Link>
            <h1 className="text-xl font-bold text-text-main dark:text-white leading-tight">Profile & Settings</h1>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
            {/* User Info Section */}
            <div className="flex flex-col items-center mt-6 mb-8 px-6">
              <div className="relative mb-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[3px] shadow-lg shadow-primary/30">
                  <img
                    alt="User Profile"
                    className="h-full w-full rounded-full object-cover border-[3px] border-white dark:border-background-dark"
                    src={user?.imageUrl || "https://placeholder.com/150"}
                  />
                </div>
                <button className="h-10 w-10 flex items-center justify-center absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md border-2 border-white dark:border-background-dark hover:bg-primary-hover transition-colors">
                  <span className="material-symbols-outlined text-[8px]">edit</span>
                </button>
              </div>
              <h2 className="text-2xl font-bold text-text-main dark:text-white">{user?.fullName || "User"}</h2>
              <p className="text-sm font-medium text-text-sub dark:text-slate-400">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>

            {/* Profile Settings List */}
            <div className="mx-4 mb-4 bg-white dark:bg-[#1a2230] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-text-sub dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">Account</h3>
              <div className="flex flex-col">
                <button className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors text-text-main dark:text-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-text-sub">person</span>
                    <span className="font-medium text-[15px]">Personal Information</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
                <div className="h-px w-full bg-slate-100 dark:bg-gray-800 my-1 mx-2" />
                <button className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors text-text-main dark:text-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-text-sub">lock</span>
                    <span className="font-medium text-[15px]">Privacy & Security</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="mx-4 mb-4 bg-white dark:bg-[#1a2230] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-text-sub dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">Preferences</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 rounded-xl text-text-main dark:text-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-text-sub">notifications</span>
                    <span className="font-medium text-[15px]">Push Notifications</span>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl text-text-main dark:text-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-text-sub">dark_mode</span>
                    <span className="font-medium text-[15px]">Dark Mode</span>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
              </div>
            </div>

            <ProfileLocationToggleCard />

            <div className="mx-4 mt-6 mb-8 text-center pt-2">
              <SignOutButton>
                <button className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-red-500 font-bold bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 shadow-sm border border-red-100 dark:border-red-500/20 transition-all">
                  <span className="material-symbols-outlined">logout</span>
                  Log Out
                </button>
              </SignOutButton>
            </div>
          </main>
          
          <BottomNav />
          <Toaster />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <p>Please log in to view your profile.</p>
        </div>
      )}
    </Suspense>
  );
}
