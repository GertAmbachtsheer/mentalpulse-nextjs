"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const APP_DISPLAY_NAME = "Mental Pulse";

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
    <header className="sticky top-0 z-10 flex w-full items-center justify-between gap-3 bg-background-light/80 px-6 pt-12 pb-4 backdrop-blur-md dark:bg-background-dark/80">
      <Link
        href="/"
        className="flex min-w-0 max-w-[55%] items-center gap-2.5 rounded-xl py-1 pr-1 outline-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl p-[2px]">
          <Image
            src="/icon512_rounded.png"
            alt=""
            width={40}
            height={40}
            className="h-full w-full rounded-[10px]"
            priority
          />
        </div>
        <span className="truncate font-display text-xl font-bold leading-tight text-text-main dark:text-white">
          {APP_DISPLAY_NAME}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-medium text-text-sub dark:text-slate-400">{getGreeting()},</p>
          <h1 className="text-lg font-bold text-text-main dark:text-white leading-tight">{firstName}</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-linear-to-tr from-primary to-blue-400 p-[2px]">
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
