"use client";
import AuthGuard from "@/components/AuthGuard";
import { Suspense } from "react";
import Loading from "../loading";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { MdArrowBack } from "react-icons/md";
import BottomNav from "@/components/BottomNav";
import Image from "next/image";

export default function Resources() {
  return (
    <AuthGuard>
      <Suspense fallback={<Loading />}>
        {/* Container aligned with Stitch layout */}
        <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark text-text-main dark:text-text-sub overflow-x-hidden shadow-xl transition-colors duration-200">
          {/* Header */}
          <div className="flex items-center bg-white dark:bg-surface-dark px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <Link
              href="/"
              className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MdArrowBack className="text-2xl text-text-main dark:text-white" />
            </Link>
            <h2 className="text-text-main dark:text-white text-lg font-bold flex-1 text-center pr-10">
              Resources
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
            <div className="flex-1 m-2 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800 mb-4">
              <Link href="https://fathersofvalor.co.za" target="_blank" className="flex items-center gap-2">
                <div className="w-full max-w-25"><Image src="/fov-logo.jpeg" alt="Resource 1" width={100} height={100} /></div>
                <div className="border-l border-l-gray-400 pl-2 py-2">
                  <h3 className="text-text-main dark:text-white text-lg font-bold">Fathers of Valor</h3>
                  <p className="text-text-sub dark:text-text-sub text-sm">One Man Can Change a Generation. Become part of a movement that equips men to lead with purpose, integrity, and faith.</p>
                </div>
              </Link>
            </div>
            <div className="flex-1 m-2 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800 mb-4">
              <Link href="https://twnaf.com/" target="_blank" className="flex items-center gap-2">
                <div className="w-full max-w-25"><Image src="/twnaf.jpg" alt="Resource 1" width={100} height={100} /></div>
                <div className="border-l border-l-gray-400 pl-2 py-2">
                  <h3 className="text-text-main dark:text-white text-lg font-bold">The World Needs a Father</h3>
                  <p className="text-text-sub dark:text-text-sub text-sm">EQUIPPING FATHERS | BUILDING HEALTHY FAMILIES | TRANSFORMING COMMUNITIES | HEALING THE WORLD</p>
                </div>
              </Link>
            </div>
            <div className="flex-1 m-2 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800 mb-4">
              <Link href="https://zeal.org.za/" target="_blank" className="flex items-center gap-2">
                <div className="w-full max-w-25"><Image src="/zeal.png" alt="Resource 1" width={100} height={100} content="cover" /></div>
                <div className="border-l border-l-gray-400 pl-2 py-2">
                  <h3 className="text-text-main dark:text-white text-lg font-bold">Zeal</h3>
                  <p className="text-text-sub dark:text-text-sub text-sm">Adventure. Brotherhood. Courage.</p>
                </div>
              </Link>
            </div>
            
          </div>

          <BottomNav />
          <Toaster />
        </div>
      </Suspense>
    </AuthGuard>
  );
}