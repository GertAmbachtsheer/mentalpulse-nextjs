"use client";
import AuthGuard from "@/components/AuthGuard";
import CustomUserButton from "@/components/CustomUserButton";
import { Suspense } from "react";
import Loading from "../loading";
import { Toaster } from "@/components/ui/sonner";
import { ResourcesMoodChart } from "@/components/ResourcesMoodChart";
import { ResourcesMoodCalendar } from "@/components/ResourcesMoodCalendar";
import { ResourcesInsights } from "@/components/ResourcesInsights";
import Link from "next/link";
import { MdArrowBack } from "react-icons/md";
import BottomNav from "@/components/BottomNav";

export default function Resources() {
  return (
    <AuthGuard>
      <Suspense fallback={<Loading />}>
        {/* Container aligned with Stitch layout */}
        <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col bg-[#f6f6f8] dark:bg-[#101622] text-[#111318] dark:text-[#f1f5f9] overflow-x-hidden shadow-xl transition-colors duration-200">
          {/* Header */}
          <div className="flex items-center bg-white dark:bg-surface-dark px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <Link
              href="/"
              className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MdArrowBack className="text-2xl text-text-main dark:text-white" />
            </Link>
            <h2 className="text-text-main dark:text-white text-lg font-bold flex-1 text-center pr-10">
              Mood Statistics
            </h2>
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
        </div>
      </Suspense>
    </AuthGuard>
  );
}