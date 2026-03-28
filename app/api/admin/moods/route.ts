import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

function getWeekRange() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { start: sunday.toISOString(), end: saturday.toISOString() };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const role =
      (currentUser.unsafeMetadata?.role as string) ??
      (currentUser.privateMetadata?.role as string) ??
      "user";

    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Service role key bypasses RLS; fall back to anon client if key is not configured
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const db = serviceKey
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      : supabase;

    // Get total user count separately to avoid count: "exact" compatibility issues
    const { count, error: countError } = await db
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("[Admin Moods] Count error:", countError);
      return NextResponse.json(
        { error: "Failed to count users", detail: countError.message },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    // Fetch one page of users
    const { data: usersData, error: usersError } = await db
      .from("users")
      .select("user_id, first_name, last_name")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (usersError) {
      console.error("[Admin Moods] Users error:", usersError);
      return NextResponse.json(
        { error: "Failed to load users", detail: usersError.message },
        { status: 500 }
      );
    }

    const userIds = (usersData ?? []).map((u) => u.user_id as string);

    if (userIds.length === 0) {
      return NextResponse.json({ users: [], page, total, hasMore: false });
    }

    // Fetch this week's moods for only this page's users
    const { start, end } = getWeekRange();

    const { data: moodsData, error: moodsError } = await db
      .from("moods")
      .select("user_id, mood, created_at")
      .in("user_id", userIds)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: true });

    if (moodsError) {
      console.error("[Admin Moods] Moods error:", moodsError);
      return NextResponse.json(
        { error: "Failed to load moods", detail: moodsError.message },
        { status: 500 }
      );
    }

    const moodsByUser: Record<string, { mood: string; created_at: string }[]> = {};
    for (const m of moodsData ?? []) {
      if (!moodsByUser[m.user_id]) moodsByUser[m.user_id] = [];
      moodsByUser[m.user_id].push({ mood: m.mood, created_at: m.created_at });
    }

    const users = (usersData ?? []).map((u) => ({
      id: u.user_id as string,
      firstName: (u.first_name as string | null) ?? null,
      lastName: (u.last_name as string | null) ?? null,
      moods: moodsByUser[u.user_id] ?? [],
    }));

    return NextResponse.json({
      users,
      page,
      total,
      hasMore: from + PAGE_SIZE < total,
    });
  } catch (err) {
    console.error("[Admin Moods] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error", detail: String(err) },
      { status: 500 }
    );
  }
}
