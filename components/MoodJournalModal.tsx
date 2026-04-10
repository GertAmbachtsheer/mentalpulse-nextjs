"use client";

import { useState, useEffect } from "react";
import { upsertMoodJournal } from "@/lib/supabaseCalls";
import { MoodJournalRow } from "@/lib/types";

interface MoodJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  mood: string;
  moodId: string;
  userId: string;
  existingJournal: MoodJournalRow | null;
  onSaved: (journal: MoodJournalRow) => void;
}

const moodColors: Record<string, string> = {
  Terrible: "text-red-500",
  Bad: "text-orange-500",
  Neutral: "text-yellow-500",
  Good: "text-blue-500",
  Great: "text-green-500",
};

const moodBorders: Record<string, string> = {
  Terrible: "border-red-200 dark:border-red-800",
  Bad: "border-orange-200 dark:border-orange-800",
  Neutral: "border-yellow-200 dark:border-yellow-800",
  Good: "border-blue-200 dark:border-blue-800",
  Great: "border-green-200 dark:border-green-800",
};

export default function MoodJournalModal({
  isOpen,
  onClose,
  mood,
  moodId,
  userId,
  existingJournal,
  onSaved,
}: MoodJournalModalProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(existingJournal?.content ?? "");
    }
  }, [isOpen, existingJournal]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!content.trim() || !userId) return;
    setSaving(true);
    try {
      const saved = await upsertMoodJournal({
        id: existingJournal?.id,
        userId,
        moodId,
        content: content.trim(),
      });
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error("Error saving journal:", err?.message ?? err?.code ?? JSON.stringify(err));
    } finally {
      setSaving(false);
    }
  }

  const colorClass = moodColors[mood] ?? "text-slate-500";
  const borderClass = moodBorders[mood] ?? "border-slate-200";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-xl border ${borderClass} p-6 z-[201]`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-main dark:text-white">
              {existingJournal ? "Your Journal" : "Add a Journal Entry"}
            </h3>
            <p className={`text-sm font-medium ${colorClass}`}>
              Feeling {mood} today
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about how you're feeling, what's on your mind..."
          rows={5}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-text-main dark:text-white placeholder-slate-400 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition"
        />

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              mood === "Terrible"
                ? "bg-red-500 hover:bg-red-600"
                : mood === "Bad"
                ? "bg-orange-500 hover:bg-orange-600"
                : mood === "Neutral"
                ? "bg-yellow-500 hover:bg-yellow-600"
                : mood === "Good"
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {saving ? "Saving..." : existingJournal ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
