"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const MOOD_VALUES: Record<string, number> = {
  Great: 4,
  Good: 3,
  Neutral: 2,
  Bad: 1,
  Terrible: 0,
};

const MOOD_COLORS: Record<string, string> = {
  Great: "#22c55e",
  Good: "#2b6cee",
  Neutral: "#eab308",
  Bad: "#f97316",
  Terrible: "#ef4444",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getCurrentWeekDates() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { date: d, label: DAY_LABELS[i], isToday: isSameDay(d, today) };
  });
}

type MoodEntry = { mood: string; created_at: string };

type UserMoodData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  moods: MoodEntry[];
};

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

function MiniLineChart({ moods }: { moods: MoodEntry[] }) {
  const weekDates = getCurrentWeekDates();

  const chartData = weekDates.map(({ date, label, isToday }, i) => {
    const entry = moods.find((m) => isSameDay(new Date(m.created_at), date)) ?? null;
    const mood = entry?.mood ?? null;
    const value = mood !== null ? (MOOD_VALUES[mood] ?? null) : null;
    return { label, mood, value, isToday, i };
  });

  // SVG layout
  const W = 280;
  const plotTop = 16;   // room for high label above top dot
  const plotH = 52;
  const plotBottom = plotTop + plotH;
  const dayLabelY = plotBottom + 14;
  const totalH = plotBottom + 24;
  const padX = 14;
  const chartW = W - 2 * padX;

  const xAt = (i: number) => padX + (i / 6) * chartW;
  const yAt = (v: number) => plotTop + ((4 - v) / 4) * plotH;

  const dataPoints = chartData
    .filter((d) => d.value !== null)
    .map((d) => ({ x: xAt(d.i), y: yAt(d.value!), mood: d.mood!, value: d.value! }));

  const smoothPath = buildSmoothPath(dataPoints);

  const maxVal = dataPoints.length > 0 ? Math.max(...dataPoints.map((p) => p.value)) : null;
  const minVal = dataPoints.length > 0 ? Math.min(...dataPoints.map((p) => p.value)) : null;

  const highPoint = maxVal !== null ? dataPoints.find((p) => p.value === maxVal)! : null;
  const lowPoint =
    minVal !== null && minVal !== maxVal
      ? dataPoints.find((p) => p.value === minVal)!
      : null;

  if (dataPoints.length === 0) {
    return (
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center">
        No moods this week
      </p>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${totalH}`}
      className="w-full mt-2"
      style={{ overflow: "visible" }}
    >
      {/* Horizontal guide lines */}
      {[0, 1, 2, 3, 4].map((v) => (
        <line
          key={v}
          x1={padX}
          y1={yAt(v)}
          x2={W - padX}
          y2={yAt(v)}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-slate-200 dark:text-slate-700"
          strokeDasharray="3 3"
        />
      ))}

      {/* Smooth connecting line */}
      {dataPoints.length > 1 && (
        <path
          d={smoothPath}
          fill="none"
          stroke="#2b6cee"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill={MOOD_COLORS[p.mood] ?? "#2b6cee"}
          stroke="white"
          strokeWidth="1.5"
        />
      ))}

      {/* High label */}
      {highPoint && (
        <text
          x={highPoint.x}
          y={highPoint.y - 7}
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="700"
          fill={MOOD_COLORS[highPoint.mood] ?? "#2b6cee"}
        >
          {highPoint.mood}
        </text>
      )}

      {/* Low label */}
      {lowPoint && (
        <text
          x={lowPoint.x}
          y={lowPoint.y + 13}
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="700"
          fill={MOOD_COLORS[lowPoint.mood] ?? "#ef4444"}
        >
          {lowPoint.mood}
        </text>
      )}

      {/* Day labels */}
      {chartData.map((d) => (
        <text
          key={d.i}
          x={xAt(d.i)}
          y={dayLabelY}
          textAnchor="middle"
          fontSize="8"
          fontWeight={d.isToday ? "700" : "600"}
          fill={d.isToday ? "#2b6cee" : "#94a3b8"}
        >
          {d.label[0]}
        </text>
      ))}
    </svg>
  );
}

export function AdminMoodsSection() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserMoodData[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p: number) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/moods?page=${p}`);
        if (res.status === 401) { router.replace("/admin/login"); return; }
        if (res.status === 403) { router.replace("/"); return; }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail ?? body.error ?? "Failed to load mood data.");
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? 0);
        setIsLoading(false);
      } catch {
        setError("Something went wrong while loading mood data.");
        setIsLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    load(0);
  }, [isLoaded, isSignedIn, load]);

  const totalPages = Math.ceil(total / 20);
  const trackedCount = users.filter((u) => u.moods.length > 0).length;

  return (
    <>
      <section className="mb-6 max-w-5xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">
          Overview
        </h3>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              This Week
            </p>
            {isLoading ? (
              <div className="h-7 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold mt-1">{total}</p>
                <p className="text-xs text-slate-400 mt-0.5">total users</p>
              </>
            )}
          </div>
          <span className="material-symbols-outlined text-[32px] text-[#2b6cee]">
            mood
          </span>
        </div>
      </section>

      <section className="max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            Weekly Moods — Sun to Sat
          </h3>
          {!isLoading && totalPages > 1 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 animate-pulse"
              >
                <div className="h-3.5 w-28 rounded-full bg-slate-200 dark:bg-slate-700 mb-3" />
                <div className="h-14 w-full rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            No users found.
          </div>
        )}

        {!isLoading && !error && users.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                      : `User ${u.id.slice(0, 6)}`}
                  </p>
                  <MiniLineChart moods={u.moods} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {page * 20 + 1}–{Math.min(page * 20 + users.length, total)} of {total}
                </span>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page + 1 >= totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
