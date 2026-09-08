// ── Push Notifications ────────────────────────────────────────
// Disabled until VAPID key is configured
import { supabase } from "./supabase.js";

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";
const VAPID_KEY_BYTES = VAPID_KEY ? urlBase64ToUint8Array(VAPID_KEY) : null;

export async function subscribeToPush(userId, companyId) {
  // Skip if no valid VAPID key
  if (!VAPID_KEY || VAPID_KEY.length < 10) return;
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      if (subscriptionUsesKey(existing, VAPID_KEY_BYTES)) return;
      await existing.unsubscribe();
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY_BYTES,
    });
    await supabase.from("push_subscriptions").upsert({
      user_id: userId, company_id: companyId,
      subscription: JSON.stringify(sub),
    });
  } catch (e) {
    // Silently fail — push is optional
  }
}

function subscriptionUsesKey(subscription, keyBytes) {
  if (!subscription?.options?.applicationServerKey || !keyBytes) return false;
  const existingKey = new Uint8Array(subscription.options.applicationServerKey);
  if (existingKey.length !== keyBytes.length) return false;
  return existingKey.every((byte, index) => byte === keyBytes[index]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
