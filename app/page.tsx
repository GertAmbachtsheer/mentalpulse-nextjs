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
import VerseOfTheDay from "@/components/VerseOfTheDay";

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
            
            <VerseOfTheDay />

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