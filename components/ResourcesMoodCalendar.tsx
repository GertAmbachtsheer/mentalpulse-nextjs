"use client";

import { getMoods } from "@/lib/supabaseCalls";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const MOOD_EMOJIS: Record<string, string> = {
  Great: "🤩",
  Good: "😃",
  Neutral: "😐",
  Bad: "😕",
  Terrible: "😫",
};

const MOOD_BG_STYLES: Record<string, string> = {
  Great: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  Good: "bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-500",
  Neutral: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  Bad: "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
  Terrible: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

const MOOD_DOT_STYLES: Record<string, string> = {
  Great: "bg-green-500",
  Good: "bg-green-400",
  Neutral: "bg-yellow-500",
  Bad: "bg-orange-500",
  Terrible: "bg-red-500",
};


function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function ResourcesMoodCalendar() {
  const { user } = useUser();
  const [userMoods, setUserMoods] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

  const fetchMoods = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getMoods(user.id);
      setUserMoods(data || []);
    } catch (err) {
      console.error("Error fetching moods:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Start from Sunday
  const startDayOfWeek = firstDay.getDay(); // 0=Sun

  // Build mood map for quick lookup
  const moodMap = new Map<string, string>();
  userMoods.forEach((m) => {
    const d = new Date(m.created_at);
    // Only keeping the latest per day if sorted correctly, or overwrite
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!moodMap.has(key)) {
      moodMap.set(key, m.mood);
    }
  });

  const getMoodForDay = (day: number, m: number, y: number): string | null => {
    const key = `${y}-${m}-${day}`;
    return moodMap.get(key) || null;
  };

  // Calendar grid cells
  const cells: {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // Previous month overflow - use empty cells as per Stitch layout
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: -1, month: -1, year: -1, isCurrentMonth: false, isToday: false });
  }

  // Current month
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      month,
      year,
      isCurrentMonth: true,
      isToday: isSameDay(new Date(year, month, d), today),
    });
  }

  // Next month overflow - Stitch layout shows some faint numbers or empty
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: nextM, year: nextY, isCurrentMonth: false, isToday: false });
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayHeaders = ["S", "M", "T", "W", "T", "F", "S"];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const canGoNext =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  return (
    <section className="px-4 py-2">
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-gray-800">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Previous month"
          >
            <FaChevronLeft className="text-gray-900 dark:text-gray-100 text-lg" />
          </button>
          <span className="text-gray-900 dark:text-gray-100 font-bold text-base">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className={`p-2 rounded-full transition-colors ${canGoNext ? "hover:bg-gray-100 dark:hover:bg-gray-800" : "opacity-30 cursor-not-allowed"}`}
            disabled={!canGoNext}
            aria-label="Next month"
          >
            <FaChevronRight className="text-gray-900 dark:text-gray-100 text-lg" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-4 gap-x-1">
          {/* Day headers */}
          {dayHeaders.map((d, i) => (
            <div
              key={`header-${i}`}
              className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              {d}
            </div>
          ))}

          {/* Cells */}
          {cells.map((cell, i) => {
            // Empty cell
            if (cell.day === -1) {
                return <div key={i} className="h-10 w-full"></div>;
            }

            // Cell from next month
            if (!cell.isCurrentMonth) {
                return (
                    <button key={i} className="h-10 w-full flex items-center justify-center cursor-default">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 opacity-40">
                            {cell.day}
                        </div>
                    </button>
                );
            }

            const mood = getMoodForDay(cell.day, cell.month, cell.year);
            const isToday = cell.isToday;

            if (mood) {
                // Return emoji for this past day's mood
                const bgClass = MOOD_BG_STYLES[mood] || "bg-gray-100 dark:bg-gray-800";
                const dotClass = MOOD_DOT_STYLES[mood] || "bg-gray-500";

                return (
                    <button key={i} className="h-10 w-full flex items-center justify-center relative">
                        {isToday ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-[#2b6cee] text-white flex items-center justify-center text-sm font-medium shadow-md">
                                    {cell.day}
                                </div>
                                <div className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${dotClass}`}></div>
                            </>
                        ) : (
                            <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center text-lg`}>
                                {MOOD_EMOJIS[mood] || "🙂"}
                            </div>
                        )}
                    </button>
                );
            }

            // No mood logged
            return (
                <button key={i} className="h-10 w-full flex items-center justify-center relative hover:opacity-80 transition-opacity">
                    {isToday ? (
                        <>
                           <div className="w-8 h-8 rounded-full bg-[#2b6cee] text-white flex items-center justify-center text-sm font-medium shadow-md">
                               {cell.day}
                           </div>
                        </>
                    ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            {cell.day}
                        </div>
                    )}
                </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
