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
  const role =
    (currentUser.unsafeMetadata?.role as string) ??
    (currentUser.privateMetadata?.role as string) ??
    "user";

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[Admin Users] Error fetching users from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }

  const rows = data ?? [];

  const users = await Promise.all(
    rows.map(async (row: any) => {
      const supabaseCreatedAt =
        typeof row.created_at === "string" || row.created_at instanceof Date
          ? new Date(row.created_at).getTime()
          : Date.now();

      try {
        const user = await client.users.getUser(row.user_id);
        const userRole =
          (user.unsafeMetadata?.role as string) ??
          (user.privateMetadata?.role as string) ??
          "user";

        const primaryEmail =
          user.emailAddresses && user.emailAddresses.length > 0
            ? user.emailAddresses[0]?.emailAddress ?? null
            : null;

        return {
          id: row.user_id as string,
          firstName: (row.first_name as string | null) ?? user.firstName ?? null,
          lastName: (row.last_name as string | null) ?? user.lastName ?? null,
          email: primaryEmail,
          phoneNumber: (row.phone_number as string | null) ?? null,
          role: userRole,
          createdAt: supabaseCreatedAt,
        };
      } catch (err) {
        console.error(
          "[Admin Users] Failed to hydrate Clerk user for",
          row.user_id,
          err
        );

        return {
          id: row.user_id as string,
          firstName: (row.first_name as string | null) ?? null,
          lastName: (row.last_name as string | null) ?? null,
          email: null,
          phoneNumber: (row.phone_number as string | null) ?? null,
          role: "user",
          createdAt: supabaseCreatedAt,
        };
      }
    })
  );

  return NextResponse.json({ users });
}

