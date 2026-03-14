import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { upsertUserProfile } from "@/lib/supabaseCalls";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phoneNumber } = body as {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    };

    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, phoneNumber" },
        { status: 400 }
      );
    }

    const profile = await upsertUserProfile({
      userId,
      firstName,
      lastName,
      phoneNumber,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Users API] Error creating/updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to save user profile" },
      { status: 500 }
    );
  }
}

