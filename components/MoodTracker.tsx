"use client";

import { moodsApi } from "@/lib/convexCalls";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { FaRegFaceSmileBeam, FaRegFaceGrin, FaRegFaceMeh, FaRegFaceFrownOpen, FaRegFaceFrown  } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { fromUnixTime } from 'date-fns';

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
  
  // Call hooks directly in the component
  const upsertMoodMutation = useMutation(moodsApi.upsertMood);
  const userMood = useQuery(moodsApi.getRecentUserMood, 
    user?.id ? { userId: user.id } : "skip"
  );

  // Initialize mood from recent user mood
  useEffect(() => {
    if (userMood && userMood._creationTime) {
      const userMoodDate = fromUnixTime(userMood._creationTime / 1000);
      const today = new Date();
      const currentDayMood = isSameDay(userMoodDate, today);
      
      if (currentDayMood && userMood.mood) {
        setMood(userMood.mood);
        setSameDay(true);
      }
    }
  }, [userMood]);

  function selectMood(inputMood: string) {
    if (mood === inputMood || !user?.id) return;
    setMood(inputMood);
    upsertMoodMutation({ id: userMood?._id, userId: user.id, mood: inputMood, sameDay });
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
    <section className="mx-4 mt-3 mb-3 bg-white rounded-xl p-6 shadow-sm border border-border/80">
      <h2 className="text-2xl font-semibold text-center mb-6">How are you feeling today?</h2>
      <div className="flex justify-around">
        <button value="Great" className="rounded-full" onClick={() => selectMood("Great")}>
          <FaRegFaceSmileBeam className={`w-20 h-20 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Great" ? "text-green-500" : "text-gray-500 hover:text-green-500"}`} />
          <span className="text-sm font-medium">Great</span>
        </button>
        <button value="Good" className="rounded-full" onClick={() => selectMood("Good")}>
          <FaRegFaceGrin className={`w-20 h-20 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Good" ? "text-lime-600" : "text-gray-500 hover:text-lime-600"}`} />
          <span className="text-sm font-medium">Good</span>
        </button>
        <button value="Neutral" className="rounded-full" onClick={() => selectMood("Neutral")}>
          <FaRegFaceMeh className={`w-20 h-20 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Neutral" ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"}`} />
          <span className="text-sm font-medium">Neutral</span>
        </button>
        <button value="Bad" className="rounded-full" onClick={() => selectMood("Bad")}>
          <FaRegFaceFrownOpen className={`w-20 h-20 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Bad" ? "text-orange-500" : "text-gray-500 hover:text-orange-500"}`} />
          <span className="text-sm font-medium">Bad</span>
        </button>
        <button value="Terrible" className="rounded-full" onClick={() => selectMood("Terrible")}>
          <FaRegFaceFrown className={`w-20 h-20 transition-all duration-200 hover:scale-105 cursor-pointer ${mood === "Terrible" ? "text-red-500" : "text-gray-500 hover:text-red-500"}`} />
          <span className="text-sm font-medium">Terrible</span>
        </button>
      </div>
    </section>
  );
}