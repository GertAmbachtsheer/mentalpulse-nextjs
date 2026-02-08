import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { moodsApi } from "@/lib/convexCalls";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { format, fromUnixTime } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CardContent } from "@/components/ui/card";

const chartConfig = {
  moodValue: {
    label: "Mood Value",
    color: "#2563eb",
  },
  date: {
    label: "Date",
    color: "#2563eb",
  }
} satisfies ChartConfig

export function ProfileMoodChart() {
  const { user, isLoaded } = useUser();
  const userMoods = useQuery(moodsApi.getMoods, 
    user?.id ? { userId: user.id } : "skip"
  );
  const getLast14Dates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const formatted = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/')
      dates.push(formatted)
    }
    return dates
  }
  const moodValues = { Great: 4, Good: 3, Neutral: 2, Bad: 1, Terrible: 0 } as const;
  type MoodValue = keyof typeof moodValues;
  const dataMap = new Map()
  userMoods?.forEach(mood => {
    dataMap.set(format(fromUnixTime(mood._creationTime / 1000), "dd/MM/yyyy"), mood.mood)
  });

  const chartData = getLast14Dates().map(date => ({
    date,
    moodValue: dataMap.has(date) ? moodValues[dataMap.get(date) as MoodValue] : null,
    mood: dataMap.get(date) || 'No data'
  }))

  // const chartData = userMoods?.map((mood) => ({
  //   date: format(fromUnixTime(mood._creationTime / 1000), "dd/MM/yyyy"),
  //   moodValue: moodValues[mood.mood as MoodValue],
  //   mood: mood.mood,
  // }))

  return (
    <CardContent className="mx-4 mt-6 mb-3 bg-white rounded-xl pt-6 pb-4 px-4 shadow-sm border border-border/80">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-60} textAnchor="end" height={80} />
          <YAxis dataKey="moodValue" />
          <Bar dataKey="moodValue" fill="var(--color-desktop)" radius={2} barSize={12} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  )
}