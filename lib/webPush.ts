import webpush from 'web-push';
import { getAllPushSubscriptions, getUserPushSubscriptions, deletePushSubscription } from './supabaseCalls';

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

/**
 * Send a Web Push notification to a specific user (all their subscriptions).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const subscriptions = await getUserPushSubscriptions(userId);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription as webpush.PushSubscription,
          JSON.stringify(payload)
        );
      } catch (error: any) {
        // HTTP 410 = subscription expired/unsubscribed
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          console.log(`[WebPush] Removing expired subscription for user ${userId}`);
          await deletePushSubscription(userId, (sub.subscription as any).endpoint);
        } else {
          console.error(`[WebPush] Error sending to user ${userId}:`, error);
        }
      }
    })
  );
}

/**
 * Broadcast a Web Push notification to all subscribed users, optionally excluding a user.
 */
export async function broadcastPush(payload: PushPayload, excludeUserId?: string): Promise<void> {
  const allSubscriptions = await getAllPushSubscriptions();

  const targets = excludeUserId
    ? allSubscriptions.filter((sub) => sub.user_id !== excludeUserId)
    : allSubscriptions;

  await Promise.allSettled(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription as webpush.PushSubscription,
          JSON.stringify(payload)
        );
      } catch (error: any) {
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          console.log(`[WebPush] Removing expired subscription for user ${sub.user_id}`);
          await deletePushSubscription(sub.user_id, (sub.subscription as any).endpoint);
        } else {
          console.error(`[WebPush] Error sending to user ${sub.user_id}:`, error);
        }
      }
    })
  );
}
