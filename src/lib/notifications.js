// ============================================================
//  PUSH NOTIFICATIONS
//  Disabled until VITE_VAPID_PUBLIC_KEY is set in .env
// ============================================================

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function requestPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

export async function subscribeToPush(userId, companyId) {
  // Skip if VAPID key not configured
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey || vapidKey.length < 10) return null;

  if (!isPushSupported()) return null;
  const permission = await requestPermission();
  if (permission !== "granted") return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const { supabase } = await import("./supabase.js");
    await supabase.from("push_subscriptions").upsert({
      user_id: userId, company_id: companyId,
      subscription: JSON.stringify(subscription),
      updated_at: new Date().toISOString(),
    });
    return subscription;
  } catch (err) {
    console.warn("Push subscription failed:", err);
    return null;
  }
}

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

export function showLocalNotification(title, body, options = {}) {
  if (Notification.permission !== "granted") return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body, icon:"/icon-192.png", badge:"/icon-192.png",
      vibrate:[200,100,200], ...options,
    });
  });
}

export const notify = {
  taskAssigned:        (title)  => showLocalNotification("New Task 📋", title, { tag:"task" }),
  submissionApproved:  (name)   => showLocalNotification("Approved ✓", `${name}'s submission approved`, { tag:"approval" }),
  submissionRevision:  (name)   => showLocalNotification("Revision ↩", `${name}'s submission needs revision`, { tag:"revision" }),
  newMessage:          (sender, preview) => showLocalNotification(`${sender} 💬`, preview, { tag:"chat" }),
  syncComplete:        (count)  => showLocalNotification("Sync Complete ✓", `${count} submission(s) uploaded`, { tag:"sync" }),
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}