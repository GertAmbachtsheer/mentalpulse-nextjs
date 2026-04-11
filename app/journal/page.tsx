"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import MoodJournalModal from "@/components/MoodJournalModal";
import { getRecentJournals } from "@/lib/supabaseCalls";
import { MoodJournalRow } from "@/lib/types";
import Link from "next/link";
import { MdArrowBack } from "react-icons/md";

type JournalEntry = MoodJournalRow & { moods: { mood: string } };

const moodColors: Record<string, { bg: string; text: string; dot: string }> = {
  Terrible: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-500", dot: "bg-red-400" },
  Bad:      { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-500", dot: "bg-orange-400" },
  Neutral:  { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-500", dot: "bg-yellow-400" },
  Good:     { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-500", dot: "bg-blue-400" },
  Great:    { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-500", dot: "bg-green-400" },
};

const moodEmojis: Record<string, string> = {
  Terrible: "😫",
  Bad: "😕",
  Neutral: "😐",
  Good: "😃",
  Great: "🤩",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function JournalPage() {
  const { user, isLoaded } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getRecentJournals(user.id);
      setEntries((data as JournalEntry[]) ?? []);
    } catch (err) {
      console.error("Error fetching journals:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) fetchEntries();
  }, [isLoaded, fetchEntries]);

  function handleSaved(updated: MoodJournalRow) {
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-md bg-background-light dark:bg-background-dark flex flex-col relative shadow-2xl min-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center bg-white dark:bg-surface-dark px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MdArrowBack className="text-2xl text-text-main dark:text-white" />
          </Link>
          <h2 className="text-text-main dark:text-white text-lg font-bold flex-1 text-center pr-10">
            My Journal
          </h2>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 no-scrollbar space-y-4 bg-slate-50/80 dark:bg-transparent">
          {loading && (
            <div className="flex justify-center py-12 text-slate-400 text-sm">
              Loading...
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <span className="text-5xl">📔</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No journal entries yet.
                <br />
                Log your mood to start writing.
              </p>
            </div>
          )}

          {entries.map((entry) => {
            const mood = entry.moods?.mood ?? "Neutral";
            const colors = moodColors[mood] ?? moodColors.Neutral;
            return (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full mb-4 bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-gray-800"
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <span className={`text-xs font-semibold ${colors.text}`}>
                      {moodEmojis[mood]} {mood}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(entry.created_at)}
                  </span>
                </div>

                {/* Content preview */}
                <p className="text-sm text-left text-text-main dark:text-white leading-relaxed line-clamp-3">
                  {entry.content}
                </p>

                {/* Edit hint */}
                <div className="mt-3 flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span className="text-[11px]">Tap to edit</span>
                </div>
              </button>
            );
          })}
        </main>

        <BottomNav />

        {selected && (
          <MoodJournalModal
            isOpen={!!selected}
            onClose={() => setSelected(null)}
            mood={selected.moods?.mood ?? "Neutral"}
            moodId={selected.mood_id}
            userId={user?.id ?? ""}
            existingJournal={selected}
            onSaved={(updated) => {
              handleSaved(updated);
              setSelected(null);
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}
