"use client";
import { useUser } from "@clerk/nextjs";
import AuthToggle from "@/components/AuthToggle";
import CustomUserButton from "@/components/CustomUserButton";
import { Suspense } from "react";
import Loading from "./loading";
import MoodTracker from "@/components/MoodTracker";
import LocationToggleCard from "@/components/LocationToggleCard";
import { Toaster } from "@/components/ui/sonner";
import SupportCard from "@/components/SupportCard";
import NotificationCenter from "@/components/NotificationCenter";

export default function Home() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gray-100 flex flex-col h-screen max-w-150 w-full mx-auto">
        {user ? (
          <>
            <nav className="flex w-full h-16 justify-between items-center border-b border-border/80 p-4 shadow-sm bg-white rounded-b-xl">
              <h1 className="text-2xl font-bold">Mental Pulse</h1>
              <CustomUserButton />
            </nav>
            <NotificationCenter />
            <LocationToggleCard />
            <MoodTracker />
            <SupportCard />
            <Toaster />
          </>
        ) : (
          <AuthToggle />
        )}
      </div>
    </Suspense>
  );
}