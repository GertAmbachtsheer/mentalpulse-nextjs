"use client";
import { useUser } from "@clerk/nextjs";
import AuthToggle from "@/components/AuthToggle";
import CustomUserButton from "@/components/CustomUserButton";
import { Suspense } from "react";
import Loading from "../loading";
import ProfileLocationToggleCard from "@/components/ProfileLocationToggleCard";
import { Toaster } from "@/components/ui/sonner";
import { ProfileMoodChart } from "@/components/ProfileMoodChart";
import { ProfileMoodCalendar } from "@/components/ProfileMoodCalendar";
import Link from "next/link";
import { IoHomeOutline } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa6";

export default function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gray-100 flex flex-col h-screen max-w-150 w-full mx-auto">
        {user ? (
          <>
            <nav className="flex flex-col w-full border-b border-border/80 shadow-sm bg-white rounded-b-xl">
              <div className="flex w-full h-16 p-4 justify-between items-center border-b border-border/80">
                <h1 className="text-2xl font-bold">Mental Pulse - Profile</h1>
                <CustomUserButton />
              </div>
              <div className="flex w-full h-10 p-4 justify-between items-center">
                <h2 className="flex items-center gap-2"><Link href="/" className="flex items-center gap-2"><IoHomeOutline className="text-lg" /></Link><FaChevronRight className="text-sm text-muted-foreground" /><span className="text-md font-semibold text-muted-foreground">Profile</span></h2>
                <h2 className="text-lg font-semibold">{user?.fullName}</h2>
              </div>
            </nav>
            <ProfileLocationToggleCard />
            <ProfileMoodChart />
            <ProfileMoodCalendar />
            <Toaster />
          </>
        ) : (
          <AuthToggle />
        )}
      </div>
    </Suspense>
  );
}