"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 px-6 py-3 pb-6 safe-area-bottom shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-50">
      <ul className="flex items-center justify-between m-0 p-0 list-none">
        <li>
          <Link className={`flex flex-col items-center gap-1 group transition-colors ${pathname === '/' ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`} href="/">
            <span className="material-symbols-outlined fill-current text-[26px] group-hover:scale-110 transition-transform">home</span>
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
        </li>
        <li>
          <Link className={`flex flex-col items-center gap-1 group transition-colors ${pathname === '/journal' ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`} href="#">
            <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">menu_book</span>
            <span className="text-[10px] font-medium">Journal</span>
          </Link>
        </li>
        <li>
          <div className="relative -top-8">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 hover:bg-primary-hover hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>
        </li>
        <li>
          <Link className={`flex flex-col items-center gap-1 group transition-colors ${pathname === '/resources' ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`} href="/resources">
            <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">spa</span>
            <span className="text-[10px] font-medium">Resources</span>
          </Link>
        </li>
        <li>
          <Link className={`flex flex-col items-center gap-1 group transition-colors ${pathname === '/profile' ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`} href="/profile">
            <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
