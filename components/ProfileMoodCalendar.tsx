"use client";

import { getMoods } from "@/lib/supabaseCalls";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const MOOD_COLORS: Record<string, string> = {
  Great: "#22c55e",
  Good: "#84cc16",
  Neutral: "#eab308",
  Bad: "#f97316",
  Terrible: "#ef4444",
};

const MOOD_BG: Record<string, string> = {
  Great: "#dcfce7",
  Good: "#ecfccb",
  Neutral: "#fef9c3",
  Bad: "#ffedd5",
  Terrible: "#fee2e2",
};

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function ProfileMoodCalendar() {
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
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    moodMap.set(key, m.mood);
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

  // Previous month overflow
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, month: m, year: y, isCurrentMonth: false, isToday: false });
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

  // Next month overflow to fill grid
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
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    // Don't allow navigating past current month
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const canGoNext =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  return (
    <section className="mx-4 mt-3 mb-3 bg-white rounded-xl pt-5 pb-4 px-5 shadow-sm border border-border/80">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Monthly view</h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <FaChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className={`p-1.5 rounded-lg transition-colors ${canGoNext ? "hover:bg-gray-100" : "opacity-30 cursor-not-allowed"}`}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <FaChevronRight className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayHeaders.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const mood = getMoodForDay(cell.day, cell.month, cell.year);
          const bgColor = mood ? MOOD_COLORS[mood] : undefined;
          const lightBg = mood ? MOOD_BG[mood] : undefined;
          const textColor = mood ? MOOD_COLORS[mood] : cell.isCurrentMonth ? "#374151" : "#d1d5db";

          return (
            <div
              key={i}
              className={`
                relative flex items-center justify-center rounded-lg aspect-square text-sm font-bold transition-all
                ${cell.isToday ? "ring-2 ring-orange-400 ring-offset-1" : ""}
                ${!cell.isCurrentMonth ? "opacity-40" : ""}
              `}
              style={{
                backgroundColor: mood ? lightBg : cell.isCurrentMonth ? "#f9fafb" : "transparent",
                color: textColor,
              }}
              title={mood ? `${cell.day}: ${mood}` : undefined}
            >
              {/* Colored top bar indicator */}
              {mood && (
                <div
                  className="absolute top-0 left-1 right-1 h-1 rounded-full"
                  style={{ backgroundColor: bgColor }}
                />
              )}
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        {Object.entries(MOOD_COLORS).map(([mood, color]) => (
          <div key={mood} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-gray-500">{mood}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
