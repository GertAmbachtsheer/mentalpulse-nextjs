"use client";
import { useUser } from "@clerk/nextjs";
import AuthToggle from "@/components/AuthToggle";
import CustomUserButton from "@/components/CustomUserButton";
import { Suspense } from "react";
import Loading from "../loading";
import ProfileLocationToggleCard from "@/components/ProfileLocationToggleCard";
import { Toaster } from "@/components/ui/sonner";
import { ResourcesMoodChart } from "@/components/ResourcesMoodChart";
import { ResourcesMoodCalendar } from "@/components/ResourcesMoodCalendar";
import { ResourcesInsights } from "@/components/ResourcesInsights";
import Link from "next/link";
import { MdArrowBack } from "react-icons/md";
import BottomNav from "@/components/BottomNav";

export default function Resources() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      {/* Container aligned with Stitch layout */}
      <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col bg-[#f6f6f8] dark:bg-[#101622] text-[#111318] dark:text-[#f1f5f9] overflow-x-hidden shadow-xl transition-colors duration-200">
        {user ? (
          <>
            {/* Header */}
            <div className="flex items-center bg-white dark:bg-[#1a2230] px-4 py-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <Link href="/" className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <MdArrowBack className="text-2xl text-[#111318] dark:text-[#f1f5f9]" />
              </Link>
              <h2 className="text-[#111318] dark:text-[#f1f5f9] text-lg font-bold leading-tight flex-1 text-center pr-2">
                Mood Statistics
              </h2>
              <div className="flex items-center justify-end">
                <CustomUserButton />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
              <ResourcesMoodChart />
              <ResourcesMoodCalendar />
              <ResourcesInsights />
              <Toaster />
            </div>

            {/* Fixed BottomNav */}
            <div className="fixed bottom-0 w-full max-w-md bg-white dark:bg-[#1a2230] border-t border-gray-200 dark:border-gray-800 z-50">
              <BottomNav />
            </div>
          </>
        ) : (
          <AuthToggle />
        )}
      </div>
    </Suspense>
  );
}