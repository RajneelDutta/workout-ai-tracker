import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Dumbbell, Clock, Layers } from "lucide-react";

interface WorkoutDetailProps {
  workoutId: number | null;
  open: boolean;
  onClose: () => void;
}

export function WorkoutDetail({
  workoutId,
  open,
  onClose,
}: WorkoutDetailProps) {
  const workoutQuery = trpc.workouts.get.useQuery(
    { id: workoutId! },
    { enabled: open && workoutId !== null }
  );

  const exercisesQuery = trpc.exercises.list.useQuery(undefined, {
    enabled: open && workoutId !== null,
  });

  const workout = workoutQuery.data;
  const exercises = exercisesQuery.data;

  // Build exercise lookup map
  const exerciseMap = new Map(exercises?.map(e => [e.id, e]) ?? []);

  // Group sets by exerciseId, preserving order
  const groupedSets = new Map<number, NonNullable<typeof workout>["sets"]>();
  if (workout?.sets) {
    for (const set of workout.sets) {
      const existing = groupedSets.get(set.exerciseId) ?? [];
      existing.push(set);
      groupedSets.set(set.exerciseId, existing);
    }
  }

  // Compute stats
  const totalSets = workout?.sets?.length ?? 0;
  const totalVolume =
    workout?.sets?.reduce((sum, s) => {
      if (s.reps && s.weight) return sum + s.reps * Number(s.weight);
      return sum;
    }, 0) ?? 0;

  const isLoading = workoutQuery.isLoading || exercisesQuery.isLoading;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        {isLoading ? (
          <div className="space-y-4 p-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2 mt-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : workout ? (
          <>
            <SheetHeader>
              <SheetTitle>{workout.name}</SheetTitle>
              <SheetDescription>
                {new Date(workout.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </SheetDescription>
            </SheetHeader>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 px-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Layers className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{totalSets}</p>
                <p className="text-xs text-muted-foreground">Sets</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Dumbbell className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">
                  {totalVolume > 0
                    ? totalVolume >= 1000
                      ? `${(totalVolume / 1000).toFixed(1)}k`
                      : totalVolume.toLocaleString()
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Volume (kg)</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">
                  {workout.duration ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
            </div>

            {/* Per-exercise breakdown */}
            <div className="space-y-4 px-4 pb-4">
              {Array.from(groupedSets.entries()).map(
                ([exerciseId, exerciseSets]) => {
                  const exercise = exerciseMap.get(exerciseId);
                  return (
                    <div key={exerciseId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {exercise?.name ?? `Exercise #${exerciseId}`}
                        </p>
                        {exercise?.category && (
                          <Badge variant="secondary" className="text-xs">
                            {exercise.category}
                          </Badge>
                        )}
                      </div>
                      <div className="rounded-lg border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="py-1.5 px-3 text-left font-medium">
                                #
                              </th>
                              <th className="py-1.5 px-3 text-left font-medium">
                                Reps × Weight
                              </th>
                              <th className="py-1.5 px-3 text-left font-medium">
                                RPE
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {exerciseSets.map((set, idx) => (
                              <tr key={set.id} className="border-b last:border-0">
                                <td className="py-1.5 px-3 text-muted-foreground">
                                  {idx + 1}
                                </td>
                                <td className="py-1.5 px-3">
                                  {set.reps}
                                  {set.weight
                                    ? ` × ${Number(set.weight)} kg`
                                    : ""}
                                </td>
                                <td className="py-1.5 px-3 text-muted-foreground">
                                  {set.rpe ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Notes */}
            {workout.notes && (
              <div className="px-4 pb-4">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{workout.notes}</p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Workout not found.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
