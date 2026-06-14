import { useState, useEffect, useCallback } from "react";
import { enqueue, getQueue, dequeue, getQueueSize } from "../lib/offlineQueue.js";
import { createSubmission } from "../services/data.service.js";
import { useApp } from "../context/AppContext.jsx";

export function useOfflineSync() {
  const { company, profile } = useApp();
  const [isOnline,   setIsOnline]   = useState(navigator.onLine);
  const [queueSize,  setQueueSize]  = useState(0);
  const [syncing,    setSyncing]    = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  syncQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    getQueueSize().then(setQueueSize);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [company?.id]);

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
          await createSubmission(payload, before ?? [], after ?? []);
        }
        await dequeue(item.id);
        synced++;
      } catch (err) {
        console.warn("Sync failed for item", item.id, err);
      }
    }
    const remaining = await getQueueSize();
    setQueueSize(remaining);
    if (synced > 0) setLastSynced(new Date());
    setSyncing(false);
  }, [company?.id, profile?.id]);

  const submitWithFallback = useCallback(async (submissionData) => {
    const { before, after, ...payload } = submissionData;
    if (navigator.onLine) {
      await createSubmission(payload, before ?? [], after ?? []);
    } else {
      await enqueue("submission", submissionData);
      const size = await getQueueSize();
      setQueueSize(size);
    }
  }, [company?.id, profile?.id]);

  return { isOnline, queueSize, syncing, lastSynced, syncQueue, submitWithFallback };
}