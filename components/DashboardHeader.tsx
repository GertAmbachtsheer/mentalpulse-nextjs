"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function DashboardHeader() {
  const { user } = useUser();

  const firstName = user?.firstName || "User";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };
  const imageUrl = user?.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBTM7siy7ENg3IO7-frfuS6NZDkaJgmUwQjnZDywMwVknzGsj9iD78YRGygegN6QQeZ761VOrKA3GpkD60Si-BIwJjcVZq7XESTCJ33z9zRnGS3rECyF_ZO_havCQ0aBGP06tMItjCu8HTeC6XeQryxvyvlIlYbAEh8FV82A_pYPiDGYnB01yO0hRDZ8vVRS6ed41D3ZKo3jjr41wZLwuseELwKSAua5EOMrMC474JLd1XkhdgiCs8Q2FeaveSmUzPrLGApzgc-6lI";

  return (
    <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center">
      <div className="flex items-center gap-3 ml-auto">
        <div>
          <p className="text-xs font-medium text-text-sub dark:text-slate-400">{getGreeting()},</p>
          <h1 className="text-lg font-bold text-text-main dark:text-white leading-tight">{firstName}</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px]">
          <img
            alt="User Profile"
            className="h-full w-full rounded-full object-cover border-2 border-white dark:border-background-dark"
            src={imageUrl}
          />
        </div>
      </div>
    </header>
  );
}
