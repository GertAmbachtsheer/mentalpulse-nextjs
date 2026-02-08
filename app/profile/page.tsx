"use client";
import { Authenticated, Unauthenticated } from "convex/react";
import AuthToggle from "@/components/AuthToggle";
import CustomUserButton from "@/components/CustomUserButton";
import { Suspense } from "react";
import Loading from "../loading";
import ProfileLocationToggleCard from "@/components/ProfileLocationToggleCard";
import { Toaster } from "@/components/ui/sonner";
import { useUser } from "@clerk/nextjs";
import { ProfileMoodChart } from "@/components/ProfileMoodChart";
import Link from "next/link";
import { IoHomeOutline } from "react-icons/io5";

export default function Profile() {
  const { user } = useUser();
  
  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gray-100 flex flex-col h-screen max-w-[600px] w-full mx-auto">
        <Authenticated>
          <nav className="flex flex-col w-full border-b border-border/80 shadow-sm bg-white rounded-b-xl">
            <div className="flex w-full h-16 p-4 justify-between items-center border-b border-border/80">
              <h1 className="text-2xl font-bold">Metal Pulse - Profile</h1>
              <CustomUserButton />
            </div>
            <div className="flex w-full h-10 p-4 justify-between items-center">
              <Link href="/" className="flex items-center gap-2"><IoHomeOutline className="text-lg" />Home</Link>
              <h2 className="text-lg font-semibold">{user?.fullName}</h2>
            </div>
          </nav>
          <ProfileLocationToggleCard />
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