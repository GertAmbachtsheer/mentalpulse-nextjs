"use client";

import { getRecentUserMood, upsertMood } from "@/lib/supabaseCalls";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function MoodTracker() {
  const { user, isLoaded } = useUser();
  const [mood, setMood] = useState<string>("");
  const [sameDay, setSameDay] = useState<boolean>(false);
  const [userMood, setUserMood] = useState<any>(null);

  // Fetch recent mood on mount
  const fetchMood = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getRecentUserMood(user.id);
      setUserMood(data);
    } catch (err) {
      console.error("Error fetching mood:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMood();
  }, [fetchMood]);

  // Initialize mood from recent user mood
  useEffect(() => {
    if (userMood && userMood.created_at) {
      const userMoodDate = new Date(userMood.created_at);
      const today = new Date();
      const currentDayMood = isSameDay(userMoodDate, today);

      if (currentDayMood && userMood.mood) {
        setMood(userMood.mood);
        setSameDay(true);
      }
    }
  }, [userMood]);

  async function selectMood(inputMood: string) {
    if (mood === inputMood || !user?.id) return;
    setMood(inputMood);
    try {
      await upsertMood({ id: userMood?.id, userId: user.id, mood: inputMood, sameDay });
      // Refresh after mutation
      await fetchMood();
    } catch (err) {
      console.error("Error saving mood:", err);
    }
  }

  // Show loading state while authentication is being checked
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl text-center font-bold text-text-main dark:text-white tracking-tight">How are you feeling today?</h2>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-soft">
        <div className="flex justify-between items-center gap-2">
          {/* Mood 1: Terrible (Awful) */}
          <button 
            className="flex flex-col items-center gap-2 group focus:outline-none" 
            onClick={() => selectMood("Terrible")}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:-translate-y-1 ${mood === "Terrible" ? "bg-red-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500"}`}>
              <span className="material-symbols-outlined text-[32px]">sentiment_very_dissatisfied</span>
            </div>
            <span className={`text-[10px] font-medium ${mood === "Terrible" ? "text-red-500" : "text-slate-400"}`}>Awful</span>
          </button>
          
          {/* Mood 2: Bad */}
          <button 
            className="flex flex-col items-center gap-2 group focus:outline-none" 
            onClick={() => selectMood("Bad")}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:-translate-y-1 ${mood === "Bad" ? "bg-orange-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500"}`}>
              <span className="material-symbols-outlined text-[32px]">sentiment_dissatisfied</span>
            </div>
            <span className={`text-[10px] font-medium ${mood === "Bad" ? "text-orange-500" : "text-slate-400"}`}>Bad</span>
          </button>
          
          {/* Mood 3: Neutral (Okay) */}
          <button 
            className="flex flex-col items-center gap-2 group focus:outline-none" 
            onClick={() => selectMood("Neutral")}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:-translate-y-1 ${mood === "Neutral" ? "bg-yellow-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-yellow-100 group-hover:text-yellow-500"}`}>
              <span className="material-symbols-outlined text-[32px]">sentiment_neutral</span>
            </div>
            <span className={`text-[10px] font-medium ${mood === "Neutral" ? "text-yellow-500" : "text-slate-400"}`}>Okay</span>
          </button>
          
          {/* Mood 4: Good */}
          <button 
            className="flex flex-col items-center gap-2 group focus:outline-none" 
            onClick={() => selectMood("Good")}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:-translate-y-1 ${mood === "Good" ? "bg-blue-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500"}`}>
              <span className="material-symbols-outlined text-[32px]">sentiment_satisfied</span>
            </div>
            <span className={`text-[10px] font-medium ${mood === "Good" ? "text-blue-500" : "text-slate-400"}`}>Good</span>
          </button>
          
          {/* Mood 5: Great */}
          <button 
            className="flex flex-col items-center gap-2 group focus:outline-none" 
            onClick={() => selectMood("Great")}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:-translate-y-1 ${mood === "Great" ? "bg-green-500 text-white ring-2 ring-green-500" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-green-100 group-hover:text-green-500"}`}>
              <span className="material-symbols-outlined text-[32px]">sentiment_very_satisfied</span>
            </div>
            <span className={`text-[10px] font-medium ${mood === "Great" ? "text-green-500" : "text-slate-400"}`}>Great</span>
          </button>
        </div>
      </div>
    </div>
  );
}