"use server";

import webpush from "web-push";

// VAPID keys should be generated once and stored in environment variables
// Generate with: npx web-push generate-vapid-keys
webpush.setVapidDetails(
  "mailto:support@admin-ehlsolicitors.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// In production, store subscriptions in a database
let subscriptions: PushSubscription[] = [];

export async function subscribeUser(subscription: PushSubscription) {
  // In production: save subscription to database
  subscriptions.push(subscription);
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  // In production: remove subscription from database
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  return { success: true };
}

export async function sendNotification(
  title: string,
  body: string,
  url?: string,
) {
  if (subscriptions.length === 0) {
    return { success: false, error: "No subscriptions available" };
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/",
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/icon-96x96.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        sub as unknown as webpush.PushSubscription,
        payload,
      ),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error("Some notifications failed:", failed);
  }

  return {
    success: true,
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: failed.length,
  };
}
