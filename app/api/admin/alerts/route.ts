import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const role = (currentUser.unsafeMetadata?.role as string) ?? "user";

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("panic_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[Admin Alerts] Error fetching panic_alerts:", error);
    return NextResponse.json(
      { error: "Failed to load alerts" },
      { status: 500 }
    );
  }

  const alerts = data ?? [];

  const allUserIds = [
    ...new Set([
      ...alerts.map((a: any) => a.user_id),
      ...alerts.map((a: any) => a.respondee),
    ].filter(Boolean)),
  ];

  let nameMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
  if (allUserIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("user_id, first_name, last_name")
      .in("user_id", allUserIds);

    for (const u of usersData ?? []) {
      nameMap[u.user_id] = { first_name: u.first_name ?? null, last_name: u.last_name ?? null };
    }
  }

  const enrichedAlerts = alerts.map((a: any) => ({
    ...a,
    user_first_name: nameMap[a.user_id]?.first_name ?? null,
    user_last_name: nameMap[a.user_id]?.last_name ?? null,
    respondee_first_name: a.respondee ? (nameMap[a.respondee]?.first_name ?? null) : null,
    respondee_last_name: a.respondee ? (nameMap[a.respondee]?.last_name ?? null) : null,
  }));

  return NextResponse.json({ alerts: enrichedAlerts });
}

