import { useState, useEffect, useCallback } from "react";
import { enqueue, getQueue, dequeue, getQueueSize } from "../lib/offlineQueue.js";
import { createSubmission } from "../services/data.service.js";
import { useApp } from "../context/AppContext.jsx";

// ============================================================
//  useOfflineSync
//  - Tracks online/offline status
//  - Queues submissions when offline
//  - Auto-syncs when back online
// ============================================================
export function useOfflineSync() {
  const { company, profile } = useApp();
  const [isOnline,   setIsOnline]   = useState(navigator.onLine);
  const [queueSize,  setQueueSize]  = useState(0);
  const [syncing,    setSyncing]    = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // ── Track online/offline ──────────────────────────────────
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  syncQueue(); };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);

    // Check queue size on mount
    getQueueSize().then(setQueueSize);

    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [company?.id]);

  // ── Sync all queued items ─────────────────────────────────
  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || !company?.id) return;
    const items = await getQueue();
    if (!items.length) return;

    setSyncing(true);
    let synced = 0;

    for (const item of items) {
      try {
        if (item.type === "submission") {
          const { before, after, ...payload } = item.payload;
          await createSubmission(
            { ...payload, company_id: company.id, submitted_by: profile.id },
            before ?? [],
            after  ?? []
          );
        }
        // Add more types here: "task_done", "chat_message", etc.
        await dequeue(item.id);
        synced++;
      } catch (err) {
        console.warn("Sync failed for item", item.id, err);
        // Leave in queue — will retry next time online
      }
    }

    const remaining = await getQueueSize();
    setQueueSize(remaining);
    if (synced > 0) setLastSynced(new Date());
    setSyncing(false);
  }, [company?.id, profile?.id]);

  // ── Submit (online → direct, offline → queue) ────────────
  const submitWithFallback = useCallback(async (submissionData) => {
    if (navigator.onLine) {
      // Direct submit
      const { before, after, ...payload } = submissionData;
      await createSubmission(
        { ...payload, company_id: company.id, submitted_by: profile.id },
        before ?? [],
        after  ?? []
      );
    } else {
      // Queue for later
      await enqueue("submission", submissionData);
      const size = await getQueueSize();
      setQueueSize(size);
    }
  }, [company?.id, profile?.id]);

  return {
    isOnline,
    queueSize,
    syncing,
    lastSynced,
    syncQueue,
    submitWithFallback,
  };
}
