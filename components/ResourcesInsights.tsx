"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { getMoods } from "@/lib/supabaseCalls";
import { MdWbSunny, MdHotelClass, MdPsychology } from "react-icons/md";

// Note: Using standard react-icons instead of material-symbols-outlined for better Next.js compatibility

export function ResourcesInsights() {
  const { user } = useUser();
  const [userMoods, setUserMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getMoods(user.id);
      setUserMoods(data || []);
    } catch (err) {
      console.error("Error fetching moods:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  // Calculate insights
  const calculateInsights = () => {
    if (!userMoods || userMoods.length === 0) {
      return {
        bestDay: "N/A",
        avgMood: "0.0",
        streak: "0 Days",
        totalLogs: "0",
      };
    }

    const moodValues: Record<string, number> = {
      Great: 5,
      Good: 4,
      Neutral: 3,
      Bad: 2,
      Terrible: 1,
    };

    // Total logs this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthLogs = userMoods.filter((m) => {
      const d = new Date(m.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Best Day of the Week calculation
    const dayStats: Record<number, { sum: number; count: number }> = {};
    userMoods.forEach((m) => {
      const d = new Date(m.created_at);
      const day = d.getDay();
      const val = moodValues[m.mood] || 3;
      if (!dayStats[day]) dayStats[day] = { sum: 0, count: 0 };
      dayStats[day].sum += val;
      dayStats[day].count += 1;
    });

    let bestDayIdx = -1;
    let highestAvg = -1;
    Object.entries(dayStats).forEach(([dayStr, stats]) => {
      const avg = stats.sum / stats.count;
      if (avg > highestAvg) {
        highestAvg = avg;
        bestDayIdx = parseInt(dayStr);
      }
    });

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bestDayName = bestDayIdx !== -1 ? daysOfWeek[bestDayIdx] : "N/A";
    const bestDayAvg = highestAvg !== -1 ? highestAvg.toFixed(1) : "0.0";

    // Basic Streak Calculation (consecutive days of logging from today downwards)
    let streak = 0;
    const sortedMoods = [...userMoods].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Map dates to localized date strings to handle multiple logs on the same day easily
    const uniqueDates = Array.from(new Set(sortedMoods.map(m => new Date(m.created_at).toDateString())));
    
    let checkDate = new Date();
    checkDate.setHours(0,0,0,0);
    
    // Check if there is a log today
    let firstLogDate = new Date(uniqueDates[0]);
    firstLogDate.setHours(0,0,0,0);
    
    // If last log is today or yesterday, start counting
    const diffTime = Math.abs(checkDate.getTime() - firstLogDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 1) {
        let currentDateStart = uniqueDates[0];
        streak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const current = new Date(currentDateStart);
            current.setHours(0,0,0,0);
            
            const prev = new Date(uniqueDates[i]);
            prev.setHours(0,0,0,0);
            
            const diff = Math.ceil((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diff === 1) {
                streak++;
                currentDateStart = uniqueDates[i];
            } else {
                break;
            }
        }
    }

    return {
      bestDay: bestDayName,
      avgMood: bestDayAvg,
      streak: `${streak} Days`,
      totalLogs: thisMonthLogs.length.toString(),
    };
  };

  const insights = calculateInsights();

  if (loading) {
    return (
      <div className="px-4 py-6">
          <h3 className="text-xl font-bold mb-4 pl-1 text-gray-900 dark:text-gray-100">Insights</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar opacity-50">
             <div className="min-w-[160px] bg-white dark:bg-[#1a2230] p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800 h-[116px] animate-pulse"></div>
             <div className="min-w-[160px] bg-white dark:bg-[#1a2230] p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800 h-[116px] animate-pulse"></div>
             <div className="min-w-[160px] bg-white dark:bg-[#1a2230] p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800 h-[116px] animate-pulse"></div>
          </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h3 className="text-xl font-bold mb-4 pl-1 text-gray-900 dark:text-gray-100">Insights</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {/* Best Day Card */}
        <div className="min-w-[160px] bg-white dark:bg-[#1a2230] p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <MdWbSunny className="text-lg" />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Best Day</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{insights.bestDay}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Mood: {insights.avgMood}</p>
        </div>

        {/* Streak Card */}
        <div className="min-w-[160px] bg-white dark:bg-[#1a2230] p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <MdHotelClass className="text-lg" />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Streak</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{insights.streak}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Keep it up!</p>
        </div>

        {/* Total Logs Card */}
        <div className="min-w-[160px] bg-white dark:bg-[#1a2230] p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <MdPsychology className="text-lg" />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Logs</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{insights.totalLogs}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
        </div>
      </div>
    </div>
  );
}
