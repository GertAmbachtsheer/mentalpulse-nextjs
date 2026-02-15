import { NextRequest } from 'next/server';
import { notificationService, Notification } from '@/lib/notificationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`)
      );

      // Send existing notifications
      const existingNotifications = notificationService.getAll();
      existingNotifications.forEach((notification) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
        );
      });

      // Subscribe to new notifications
      const unsubscribe = notificationService.subscribe(
        (notification: Notification) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
            );
          } catch (error) {
            console.error('[SSE Route] Error sending notification:', error);
          }
        }
      );

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          console.error('[SSE Route] Heartbeat error:', error);
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on connection close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}