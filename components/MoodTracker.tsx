"use client";

import { getRecentUserMood, upsertMood } from "@/lib/supabaseCalls";
import { useUser } from "@clerk/nextjs";
import { FaRegFaceSmileBeam, FaRegFaceGrin, FaRegFaceMeh, FaRegFaceFrownOpen, FaRegFaceFrown } from "react-icons/fa6";
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
    <section className="mx-2 mt-1 mb-1 bg-white rounded-xl p-6 shadow-sm border border-border/80">
      <h2 className="text-2xl font-semibold text-center mb-6">How are you feeling today?</h2>
      <div className="flex justify-around">
        <button value="Great" className="rounded-full" onClick={() => selectMood("Great")}>
          <FaRegFaceSmileBeam className={`w-12 h-12 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Great" ? "text-green-500" : "text-gray-500 hover:text-green-500"}`} />
          <span className="text-sm font-medium">Great</span>
        </button>
        <button value="Good" className="rounded-full" onClick={() => selectMood("Good")}>
          <FaRegFaceGrin className={`w-12 h-12 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Good" ? "text-lime-600" : "text-gray-500 hover:text-lime-600"}`} />
          <span className="text-sm font-medium">Good</span>
        </button>
        <button value="Neutral" className="rounded-full" onClick={() => selectMood("Neutral")}>
          <FaRegFaceMeh className={`w-12 h-12 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Neutral" ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"}`} />
          <span className="text-sm font-medium">Neutral</span>
        </button>
        <button value="Bad" className="rounded-full" onClick={() => selectMood("Bad")}>
          <FaRegFaceFrownOpen className={`w-12 h-12 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Bad" ? "text-orange-500" : "text-gray-500 hover:text-orange-500"}`} />
          <span className="text-sm font-medium">Bad</span>
        </button>
        <button value="Terrible" className="rounded-full" onClick={() => selectMood("Terrible")}>
          <FaRegFaceFrown className={`w-12 h-12 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Terrible" ? "text-red-500" : "text-gray-500 hover:text-red-500"}`} />
          <span className="text-sm font-medium">Terrible</span>
        </button>
      </div>
    </section>
  );
}