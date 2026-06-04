// ============================================================
//  PUSH NOTIFICATIONS
//  Uses Web Push API + Supabase Edge Functions
//  Works on iOS (Safari 16.4+) and Android Chrome
// ============================================================

// ── Request permission ────────────────────────────────────────
export async function requestPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result;
}

// ── Check if push is supported ────────────────────────────────
export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

// ── Subscribe to push ─────────────────────────────────────────
export async function subscribeToPush(userId, companyId) {
  if (!isPushSupported()) return null;

  const permission = await requestPermission();
  if (permission !== "granted") return null;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Check existing subscription
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    // VAPID public key — generate at: https://vapidkeys.com
    // Store in .env as VITE_VAPID_PUBLIC_KEY
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn("VITE_VAPID_PUBLIC_KEY not set — push disabled");
      return null;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Save subscription to Supabase
    const { supabase } = await import("./supabase.js");
    await supabase.from("push_subscriptions").upsert({
      user_id:      userId,
      company_id:   companyId,
      subscription: JSON.stringify(subscription),
      updated_at:   new Date().toISOString(),
    });

    return subscription;
  } catch (err) {
    console.warn("Push subscription failed:", err);
    return null;
  }
}

// ── Unsubscribe ───────────────────────────────────────────────
export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
    const { supabase } = await import("./supabase.js");
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
  }
}

// ── Show local notification (no server needed) ────────────────
export function showLocalNotification(title, body, options = {}) {
  if (Notification.permission !== "granted") return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon:   "/icon-192.png",
      badge:  "/icon-192.png",
      vibrate:[200, 100, 200],
      ...options,
    });
  });
}

// ── Notification helpers ──────────────────────────────────────
export const notify = {
  taskAssigned: (taskTitle) =>
    showLocalNotification("New Task Assigned 📋", taskTitle, { tag:"task" }),

  submissionApproved: (vmName) =>
    showLocalNotification("Submission Approved ✓", `${vmName}'s submission was approved`, { tag:"approval" }),

  submissionRevision: (vmName) =>
    showLocalNotification("Revision Requested ↩", `${vmName}'s submission needs revision`, { tag:"revision" }),

  newMessage: (senderName, preview) =>
    showLocalNotification(`${senderName} 💬`, preview, { tag:"chat" }),

  syncComplete: (count) =>
    showLocalNotification("Sync Complete ✓", `${count} submission(s) uploaded`, { tag:"sync" }),
};

// ── VAPID key converter ───────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
