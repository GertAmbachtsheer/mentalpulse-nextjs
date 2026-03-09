"use client";

import { getMoods } from "@/lib/supabaseCalls";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from "react-icons/md";

const MOOD_CONFIG = {
  Great: { value: 4 },
  Good: { value: 3 },
  Neutral: { value: 2 },
  Bad: { value: 1 },
  Terrible: { value: 0 },
} as const;

type MoodKey = keyof typeof MOOD_CONFIG;

function getWeekDates(): { date: Date; label: string }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push({ date: d, label: dayNames[i] });
  }
  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

interface MoodDataPoint {
  dayLabel: string;
  mood: MoodKey | null;
  value: number | null;
  isToday: boolean;
}

export function ResourcesMoodChart() {
  const { user } = useUser();
  const [userMoods, setUserMoods] = useState<any[]>([]);

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

  const weekDates = getWeekDates();
  const today = new Date();

  // Map mood data to week days
  const chartData: MoodDataPoint[] = weekDates.map(({ date, label }) => {
    // Find the latest mood entry for that day
    const moodEntries = userMoods.filter((m) =>
      isSameDay(new Date(m.created_at), date)
    );
    // Use the first one (most recent if ordered descending)
    const moodEntry = moodEntries.length > 0 ? moodEntries[0] : null;
    const mood = moodEntry?.mood as MoodKey | undefined;
    return {
      dayLabel: label,
      mood: mood || null,
      value: mood ? MOOD_CONFIG[mood].value : null,
      isToday: isSameDay(date, today),
    };
  });

  // Calculate weekly average
  const validValues = chartData.filter((d) => d.value !== null);
  const weeklyAvg =
    validValues.length > 0
      ? validValues.reduce((s, d) => s + (d.value ?? 0), 0) /
        validValues.length
      : null;
        
  const avgMoodLabel =
    weeklyAvg !== null
      ? weeklyAvg >= 3.5
        ? "Great"
        : weeklyAvg >= 2.5
          ? "Good"
          : weeklyAvg >= 1.5
            ? "Neutral"
            : weeklyAvg >= 0.5
              ? "Bad"
              : "Terrible"
      : "No Data";

  // Calculate intra-week trend: compare first logged mood this week to the most recent
  const loggedThisWeek = chartData.filter((d) => d.value !== null);
  const firstMoodValue = loggedThisWeek.length > 0 ? loggedThisWeek[0].value : null;
  const lastMoodValue = loggedThisWeek.length > 0 ? loggedThisWeek[loggedThisWeek.length - 1].value : null;

  let trendIcon = null;
  let trendText = "";
  let trendColorClass = "text-gray-500 bg-gray-100 dark:bg-gray-800";
  let trendIconColor = "text-gray-500";

  if (firstMoodValue !== null && lastMoodValue !== null && loggedThisWeek.length > 1) {
      const diff = lastMoodValue - firstMoodValue;
      const percentChange = Math.abs((diff / 4) * 100).toFixed(0);

      if (diff > 0) {
          trendIcon = <MdTrendingUp className="text-sm" />;
          trendText = `+${percentChange}%`;
          trendColorClass = "bg-green-50 dark:bg-green-900/20";
          trendIconColor = "text-green-500";
      } else if (diff < 0) {
          trendIcon = <MdTrendingDown className="text-sm" />;
          trendText = `-${percentChange}%`;
          trendColorClass = "bg-red-50 dark:bg-red-900/20";
          trendIconColor = "text-red-500";
      } else {
          trendIcon = <MdTrendingFlat className="text-sm" />;
          trendText = "0%";
          trendColorClass = "bg-gray-50 dark:bg-gray-900/20";
          trendIconColor = "text-gray-500";
      }
  }

  // To map a value (0-4) to a percentage for the bar chart
  const getBarHeight = (value: number | null) => {
      if (value === null) return "0%";
      // Map 0 -> 20%, 1 -> 40%, 2 -> 60%, 3 -> 80%, 4 -> 100%
      return `${20 + (value * 20)}%`;
  };

  return (
    <section className="mx-4 mt-2 px-4 py-6">
      <div className="bg-white dark:bg-[#1a2230] rounded-2xl p-5 shadow-sm border border-transparent dark:border-gray-800">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Weekly Overview</p>
            <h3 className="text-gray-900 dark:text-gray-100 text-3xl font-bold">{avgMoodLabel}</h3>
          </div>
          {trendIcon && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendColorClass}`}>
                <div className={`${trendIconColor}`}>{trendIcon}</div>
                <span className={`${trendIconColor} text-sm font-bold`}>{trendText}</span>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="grid grid-cols-7 gap-3 h-48 items-end">
          {chartData.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
              <div 
                className="w-full bg-[#2b6cee]/20 dark:bg-[#2b6cee]/10 rounded-t-lg relative group-hover:bg-[#2b6cee]/30 transition-all overflow-hidden" 
                style={{ height: d.value !== null ? '100%' : '10%' }}
              >
                <div 
                  className="absolute bottom-0 w-full bg-[#2b6cee] rounded-t-lg transition-all duration-500" 
                  style={{ height: getBarHeight(d.value) }}
                />
              </div>
              <p className={`text-xs ${d.isToday ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-500 dark:text-gray-400 font-semibold'}`}>
                {d.dayLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}