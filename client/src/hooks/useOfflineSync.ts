import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getQueueLength } from "@/lib/offlineQueue";
import { flushMutationQueue } from "@/lib/offlineSync";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

export function useOfflineSync() {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot);
  const utils = trpc.useUtils();

  const flush = useCallback(async () => {
    const count = await getQueueLength();
    if (count === 0) return;

    const { flushed, failed } = await flushMutationQueue(
      async (path, input) => {
        // Dynamically resolve tRPC mutation by dot-separated path
        // e.g. "activeWorkout.logSet" → utils.client.activeWorkout.logSet.mutate
        const parts = path.split(".");
        let current: any = utils.client;
        for (const part of parts) {
          current = current[part];
        }
        return current.mutate(input);
      }
    );

    if (flushed > 0) {
      toast.success(
        `Synced ${flushed} offline action${flushed !== 1 ? "s" : ""}`
      );
      utils.activeWorkout.get.invalidate();
      utils.workouts.list.invalidate();
    }
    if (failed > 0) {
      toast.error(`Failed to sync ${failed} action${failed !== 1 ? "s" : ""}`);
    }
  }, [utils]);

  // Flush on mount and when coming back online
  useEffect(() => {
    flush();
  }, [isOnline, flush]);

  return { isOnline };
}
