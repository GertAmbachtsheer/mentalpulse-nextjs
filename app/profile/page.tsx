"use client";
import { Authenticated, Unauthenticated } from "convex/react";
import AuthToggle from "@/components/AuthToggle";
import CustomUserButton from "@/components/CustomUserButton";
import { Suspense } from "react";
import Loading from "../loading";
import LocationToggleCard from "@/components/LocationToggleCard";
import { Toaster } from "@/components/ui/sonner";
import { useUser } from "@clerk/nextjs";
import { ProfileMoodChart } from "@/components/ProfileMoodChart";

export default function Profile() {
  const { user } = useUser();
  
  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gray-100 flex flex-col h-screen w-[600px] mx-auto">
        <Authenticated>
          <nav className="flex w-full h-16 justify-between items-center border-b border-border/80 p-4 shadow-sm bg-white rounded-b-xl">
            <h1 className="text-xl font-bold">Profile - {user?.firstName} {user?.lastName}</h1>
            <CustomUserButton />
          </nav>
          <LocationToggleCard />
          <ProfileMoodChart />
          <Toaster />
        </Authenticated>
        <Unauthenticated>
          <AuthToggle />
        </Unauthenticated>
      </div>
    </Suspense>
  );
}