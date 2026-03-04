import { trpc } from "@/lib/trpc";
import { useCallback, useEffect } from "react";
import { queueSet, flushQueue } from "@/lib/offlineQueue";

export function useActiveWorkout() {
  const utils = trpc.useUtils();

  const workoutQuery = trpc.activeWorkout.get.useQuery(undefined, {
    refetchInterval: false,
  });

  const startMutation = trpc.activeWorkout.start.useMutation({
    onSuccess: () => utils.activeWorkout.get.invalidate(),
  });

  const logSetMutation = trpc.activeWorkout.logSet.useMutation({
    onSuccess: () => utils.activeWorkout.get.invalidate(),
  });

  const deleteSetMutation = trpc.activeWorkout.deleteSet.useMutation({
    onSuccess: () => utils.activeWorkout.get.invalidate(),
  });

  const completeMutation = trpc.activeWorkout.complete.useMutation({
    onSuccess: () => {
      utils.activeWorkout.get.invalidate();
      utils.workouts.list.invalidate();
      utils.personalRecords.list.invalidate();
    },
  });

  const discardMutation = trpc.activeWorkout.discard.useMutation({
    onSuccess: () => utils.activeWorkout.get.invalidate(),
  });

  const startWorkout = useCallback(
    (name: string) => startMutation.mutateAsync({ name }),
    [startMutation],
  );

  const logSet = useCallback(
    async (data: {
      exerciseId: number;
      setNumber: number;
      reps?: number;
      weight?: number;
      duration?: number;
      rpe?: number;
      isWarmup?: boolean;
    }) => {
      if (!navigator.onLine) {
        await queueSet({
          exerciseId: data.exerciseId,
          setNumber: data.setNumber,
          reps: data.reps,
          weight: data.weight,
          rpe: data.rpe,
        });
        return;
      }
      return logSetMutation.mutateAsync(data);
    },
    [logSetMutation],
  );

  // Flush offline queue when back online
  useEffect(() => {
    const handleOnline = async () => {
      const flushed = await flushQueue(async set =>
        logSetMutation.mutateAsync(set),
      );
      if (flushed > 0) {
        utils.activeWorkout.get.invalidate();
      }
    };
    window.addEventListener("online", handleOnline);
    // Also try to flush on mount
    handleOnline();
    return () => window.removeEventListener("online", handleOnline);
  }, [logSetMutation, utils]);

  const deleteSet = useCallback(
    (id: number) => deleteSetMutation.mutateAsync({ id }),
    [deleteSetMutation],
  );

  const complete = useCallback(
    (notes?: string) => completeMutation.mutateAsync({ notes }),
    [completeMutation],
  );

  const discard = useCallback(
    () => discardMutation.mutateAsync(),
    [discardMutation],
  );

  return {
    workout: workoutQuery.data,
    isLoading: workoutQuery.isLoading,
    startWorkout,
    logSet,
    deleteSet,
    complete,
    discard,
    isCompleting: completeMutation.isPending,
    isStarting: startMutation.isPending,
    isLogging: logSetMutation.isPending,
  };
}
