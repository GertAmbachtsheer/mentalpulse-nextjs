import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createServiceRoleSupabase } from "@/lib/supabase-service-role";

function getDb() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createServiceRoleSupabase();
  }
  return supabase;
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role =
    (user.unsafeMetadata?.role as string) ??
    (user.privateMetadata?.role as string) ??
    "user";
  return role === "admin" ? userId : null;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await getDb()
      .from("support")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[Admin Support] GET error:", error);
      return NextResponse.json({ error: "Failed to load support options", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ support: data ?? [] });
  } catch (err) {
    console.error("[Admin Support] Unexpected GET error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, benefits, price, type, sort_order } = body;

    if (!title || price == null || !type) {
      return NextResponse.json({ error: "title, price, and type are required" }, { status: 400 });
    }

    const { data, error } = await getDb()
      .from("support")
      .insert({ title, description: description || null, benefits: benefits || null, price, type, sort_order: sort_order ?? null })
      .select()
      .single();

    if (error) {
      console.error("[Admin Support] POST error:", error);
      return NextResponse.json({ error: "Failed to create support option", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ support: data }, { status: 201 });
  } catch (err) {
    console.error("[Admin Support] Unexpected POST error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, benefits, price, type, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await getDb()
      .from("support")
      .update({ title, description: description || null, benefits: benefits || null, price, type, sort_order: sort_order ?? null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Admin Support] PUT error:", error);
      return NextResponse.json({ error: "Failed to update support option", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ support: data });
  } catch (err) {
    console.error("[Admin Support] Unexpected PUT error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await getDb().from("support").delete().eq("id", id);

    if (error) {
      console.error("[Admin Support] DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete support option", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Support] Unexpected DELETE error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
