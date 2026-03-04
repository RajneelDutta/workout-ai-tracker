import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

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
    (data: {
      exerciseId: number;
      setNumber: number;
      reps?: number;
      weight?: number;
      duration?: number;
      rpe?: number;
      isWarmup?: boolean;
    }) => logSetMutation.mutateAsync(data),
    [logSetMutation],
  );

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
