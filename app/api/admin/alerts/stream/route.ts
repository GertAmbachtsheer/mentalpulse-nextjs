import { auth, clerkClient } from "@clerk/nextjs/server";
import { addAlertListener, removeAlertListener } from "@/lib/alertBroadcast";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const role = (currentUser.unsafeMetadata?.role as string) ?? "user";
  if (role !== "admin") return new Response("Forbidden", { status: 403 });

  const encoder = new TextEncoder();
  let listener: ((payload: string) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Initial keepalive comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      listener = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // client disconnected, clean up
          if (listener) removeAlertListener(listener);
        }
      };

      addAlertListener(listener);

      // Heartbeat every 25s to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Store interval ref so cancel can clear it
      (controller as any)._heartbeat = heartbeat;
    },
    cancel(controller) {
      if (listener) removeAlertListener(listener);
      clearInterval((controller as any)._heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
