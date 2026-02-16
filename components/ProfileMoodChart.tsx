"use client";

import { getMoods } from "@/lib/supabaseCalls";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import {
  FaRegFaceSmileBeam,
  FaRegFaceGrin,
  FaRegFaceMeh,
  FaRegFaceFrownOpen,
  FaRegFaceFrown,
} from "react-icons/fa6";

const MOOD_CONFIG = {
  Great: { value: 4, color: "#22c55e", icon: FaRegFaceSmileBeam },
  Good: { value: 3, color: "#65a30d", icon: FaRegFaceGrin },
  Neutral: { value: 2, color: "#eab308", icon: FaRegFaceMeh },
  Bad: { value: 1, color: "#f97316", icon: FaRegFaceFrownOpen },
  Terrible: { value: 0, color: "#ef4444", icon: FaRegFaceFrown },
} as const;

type MoodKey = keyof typeof MOOD_CONFIG;

const MOOD_LABELS: MoodKey[] = ["Terrible", "Bad", "Neutral", "Good", "Great"];

function getWeekDates(): { date: Date; label: string }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
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

export function ProfileMoodChart() {
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
    const moodEntry = userMoods.find((m) =>
      isSameDay(new Date(m.created_at), date)
    );
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
      : null;

  // SVG chart dimensions
  const W = 320;
  const H = 180;
  const padL = 70;
  const padR = 20;
  const padT = 16;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xStep = chartW / 6; // 7 points, 6 gaps
  const yStep = chartH / 4; // 5 mood levels, 4 gaps

  // Build polyline points for segments with data
  const points = chartData.map((d, i) => ({
    x: padL + i * xStep,
    y: d.value !== null ? padT + (4 - d.value) * yStep : null,
    mood: d.mood,
    value: d.value,
  }));

  // Build line segments between consecutive valid points
  const lineSegments: string[] = [];
  let currentPath = "";
  for (let i = 0; i < points.length; i++) {
    if (points[i].y !== null) {
      if (!currentPath) {
        currentPath = `M ${points[i].x} ${points[i].y}`;
      } else {
        currentPath += ` L ${points[i].x} ${points[i].y}`;
      }
    } else {
      if (currentPath) {
        lineSegments.push(currentPath);
        currentPath = "";
      }
    }
  }
  if (currentPath) lineSegments.push(currentPath);

  return (
    <section className="mx-4 mt-6 mb-3 bg-white rounded-xl pt-5 pb-4 px-5 shadow-sm border border-border/80">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        How have you been feeling?
      </h2>

      <div className="flex gap-4">
        {/* Y-axis legend */}
        <div className="flex flex-col justify-between py-0" style={{ height: chartH, marginTop: padT }}>
          {[...MOOD_LABELS].reverse().map((label) => {
            const cfg = MOOD_CONFIG[label];
            const Icon = cfg.icon;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                <span className="text-xs text-gray-600 w-12">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Chart SVG */}
        <div className="flex-1 overflow-visible">
          <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full h-auto" style={{ overflow: "visible" }}>
            {/* Horizontal grid lines */}
            {MOOD_LABELS.map((_, i) => (
              <line
                key={i}
                x1={padL - 50}
                y1={padT + i * yStep}
                x2={W - padR}
                y2={padT + i * yStep}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Line segments */}
            {lineSegments.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Data point icons */}
            {points.map((pt, i) => {
              if (pt.y === null || !pt.mood) return null;
              const cfg = MOOD_CONFIG[pt.mood];
              const Icon = cfg.icon;
              return (
                <foreignObject
                  key={i}
                  x={pt.x - 12}
                  y={pt.y - 12}
                  width="24"
                  height="24"
                  style={{ overflow: "visible" }}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Icon
                      className="w-6 h-6 drop-shadow-sm"
                      style={{ color: cfg.color }}
                    />
                  </div>
                </foreignObject>
              );
            })}

            {/* X-axis day labels */}
            {chartData.map((d, i) => (
              <text
                key={i}
                x={padL + i * xStep}
                y={H}
                textAnchor="middle"
                className="text-xs"
                fill={d.isToday ? "#f97316" : "#6b7280"}
                fontWeight={d.isToday ? "700" : "400"}
                fontSize="11"
              >
                {d.dayLabel}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Weekly average */}
      {weeklyAvg !== null && (
        <p className="text-sm text-gray-600 mt-3 font-medium">
          Weekly Average:{" "}
          <span className="font-bold">
            {weeklyAvg.toFixed(1)} ({avgMoodLabel})
          </span>
        </p>
      )}
      {weeklyAvg === null && (
        <p className="text-sm text-gray-400 mt-3 italic">
          No mood data recorded this week
        </p>
      )}
    </section>
  );
}