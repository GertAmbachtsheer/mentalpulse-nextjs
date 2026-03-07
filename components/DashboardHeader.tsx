"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function DashboardHeader() {
  const { user } = useUser();

  const firstName = user?.firstName || "User";
  const imageUrl = user?.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBTM7siy7ENg3IO7-frfuS6NZDkaJgmUwQjnZDywMwVknzGsj9iD78YRGygegN6QQeZ761VOrKA3GpkD60Si-BIwJjcVZq7XESTCJ33z9zRnGS3rECyF_ZO_havCQ0aBGP06tMItjCu8HTeC6XeQryxvyvlIlYbAEh8FV82A_pYPiDGYnB01yO0hRDZ8vVRS6ed41D3ZKo3jjr41wZLwuseELwKSAua5EOMrMC474JLd1XkhdgiCs8Q2FeaveSmUzPrLGApzgc-6lI";

  return (
    <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px]">
          <img
            alt="User Profile"
            className="h-full w-full rounded-full object-cover border-2 border-white dark:border-background-dark"
            src={imageUrl}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-text-sub dark:text-slate-400">Good Morning,</p>
          <h1 className="text-lg font-bold text-text-main dark:text-white leading-tight">{firstName}</h1>
        </div>
      </div>
      <button className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
        <span className="material-symbols-outlined text-text-main dark:text-white">notifications</span>
        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background-light dark:border-background-dark"></span>
      </button>
    </header>
  );
}
