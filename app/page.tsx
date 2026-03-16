"use client";
import { useUser } from "@clerk/nextjs";
import AuthToggle from "@/components/AuthToggle";
import { Suspense } from "react";
import Loading from "./loading";
import MoodTracker from "@/components/MoodTracker";
import { Toaster } from "@/components/ui/sonner";
import SupportCard from "@/components/SupportCard";
import PanicButton from "@/components/PanicButton";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      {user ? (
        <div className="mx-auto w-full max-w-md bg-background-light dark:bg-background-dark flex flex-col relative shadow-2xl min-h-screen overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
            <div className="mt-4 mb-4">
              <PanicButton />
            </div>
            <MoodTracker />
            
            <div className="relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl"></div>
              <span className="mb-3 block text-white/80 text-xs font-semibold tracking-wider uppercase">Daily Inspiration</span>
              <p className="mb-4 text-xl font-medium leading-relaxed text-white">"Fear not, for I am with you; be not dismayed, for I am your God; <br/>I will strengthen you, I will help you, I will uphold you with my righteous right hand."</p>
              <div className="flex items-center gap-2">
                <span className="h-px w-8 bg-white/40"></span>
                <span className="text-sm font-light text-white/90">Isaiah 41:10</span>
              </div>
            </div>

            <SupportCard />
            <Toaster />
          </main>
          <BottomNav />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 flex flex-col h-screen max-w-150 w-full mx-auto">
          <AuthToggle />
        </div>
      )}
    </Suspense>
  );
}