import { useState, useEffect, useMemo } from "react";
import { useActiveWorkout } from "@/hooks/useActiveWorkout";
import { useRestTimer } from "@/hooks/useRestTimer";
import { SetLogger } from "@/components/workout/SetLogger";
import { RestTimer } from "@/components/workout/RestTimer";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { WorkoutSummary } from "@/components/workout/WorkoutSummary";
import { ProgressionBadge } from "@/components/workout/ProgressionBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Check,
  X,
  Loader2,
  Dumbbell,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ExerciseGroup = {
  exerciseId: number;
  exerciseName: string;
  sets: Array<{
    id: number;
    setNumber: number;
    reps: number | null;
    weight: string | null;
    rpe: number | null;
  }>;
};

export default function ActiveWorkout() {
  const {
    workout,
    isLoading,
    startWorkout,
    logSet,
    deleteSet,
    complete,
    discard,
    isCompleting,
    isStarting,
    isLogging,
  } = useActiveWorkout();

  const [, setLocation] = useLocation();
  const timer = useRestTimer();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    duration: number;
    totalVolume: number;
    totalSets: number;
    newPRs: Array<{ exerciseId: number; weight: number }>;
    rpg?: any;
  } | null>(null);

  // Start screen state
  const [workoutName, setWorkoutName] = useState("Workout");

  // Current set input state
  const [currentExercise, setCurrentExercise] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState<number | undefined>(undefined);

  // Get last sets for prefill
  const lastSetsQuery = trpc.activeWorkout.lastSets.useQuery(
    { exerciseId: currentExercise?.id ?? 0 },
    { enabled: !!currentExercise },
  );

  // Prefill from last workout when exercise changes
  useEffect(() => {
    if (lastSetsQuery.data && lastSetsQuery.data.length > 0) {
      const last = lastSetsQuery.data[0];
      if (last.weight) setWeight(Number(last.weight));
      if (last.reps) setReps(last.reps);
    }
  }, [lastSetsQuery.data]);

  // Elapsed time
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!workout?.startedAt) return;
    const start = new Date(workout.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workout?.startedAt]);

  const elapsedStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [elapsed]);

  // Group sets by exercise
  const exerciseGroups = useMemo(() => {
    if (!workout?.sets) return [];
    const groups: ExerciseGroup[] = [];
    const map = new Map<number, ExerciseGroup>();
    for (const s of workout.sets) {
      let group = map.get(s.exerciseId);
      if (!group) {
        group = { exerciseId: s.exerciseId, exerciseName: "", sets: [] };
        map.set(s.exerciseId, group);
        groups.push(group);
      }
      group.sets.push({
        id: s.id,
        setNumber: s.setNumber,
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe,
      });
    }
    return groups;
  }, [workout?.sets]);

  // Resolve exercise names
  const exercisesQuery = trpc.exercises.list.useQuery();
  const exerciseMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const e of exercisesQuery.data ?? []) {
      m.set(e.id, e.name);
    }
    return m;
  }, [exercisesQuery.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // --- START SCREEN ---
  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Start Workout</h1>
          <p className="text-muted-foreground">
            Track your sets in real-time
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Input
            placeholder="Workout name"
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            className="text-center text-lg h-12"
          />
          <Button
            className="w-full h-14 text-lg"
            disabled={isStarting || !workoutName.trim()}
            onClick={async () => {
              try {
                await startWorkout(workoutName.trim());
              } catch {
                toast.error("Failed to start workout");
              }
            }}
          >
            {isStarting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Dumbbell className="h-5 w-5 mr-2" />
            )}
            Start
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setLocation("/dashboard")}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --- ACTIVE WORKOUT SCREEN ---
  const handleLogSet = async () => {
    if (!currentExercise) {
      toast.error("Select an exercise first");
      return;
    }
    if (reps <= 0) {
      toast.error("Enter reps");
      return;
    }

    const exerciseSets =
      workout.sets?.filter(s => s.exerciseId === currentExercise.id) ?? [];
    const setNumber = exerciseSets.length + 1;

    try {
      await logSet({
        exerciseId: currentExercise.id,
        setNumber,
        reps,
        weight: weight > 0 ? weight : undefined,
        rpe,
      });
      timer.start(90); // Auto-start rest timer
      toast.success(`Set ${setNumber} logged`);
    } catch {
      toast.error("Failed to log set");
    }
  };

  const handleFinish = async () => {
    try {
      const result = await complete();
      setSummaryData(result);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to complete workout");
    }
  };

  const handleDiscard = async () => {
    try {
      await discard();
      setShowDiscard(false);
      setLocation("/dashboard");
      toast.success("Workout discarded");
    } catch {
      toast.error("Failed to discard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <button
          onClick={() => setShowDiscard(true)}
          className="text-destructive text-sm font-medium min-w-[48px] min-h-[48px] flex items-center"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-semibold tabular-nums">
            {elapsedStr}
          </span>
        </div>
        <Button
          size="sm"
          disabled={isCompleting || (workout.sets?.length ?? 0) === 0}
          onClick={handleFinish}
        >
          {isCompleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Finish"
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-48">
        {/* Exercise groups */}
        {exerciseGroups.length > 0 && (
          <div className="divide-y">
            {exerciseGroups.map(group => (
              <div key={group.exerciseId} className="px-4 py-3">
                <h3 className="font-semibold text-sm mb-2">
                  {exerciseMap.get(group.exerciseId) ?? "Exercise"}
                </h3>
                <div className="space-y-1">
                  {group.sets.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/50"
                    >
                      <span className="text-muted-foreground w-8">
                        #{s.setNumber}
                      </span>
                      <span className="font-medium flex-1">
                        {s.weight ? `${s.weight} lbs` : "BW"} x{" "}
                        {s.reps ?? 0}
                      </span>
                      {s.rpe && (
                        <span className="text-xs text-muted-foreground mr-2">
                          RPE {s.rpe}
                        </span>
                      )}
                      <button
                        className="text-muted-foreground hover:text-destructive p-1"
                        onClick={() => deleteSet(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current exercise selection */}
        <div className="px-4 py-4 space-y-4">
          {currentExercise ? (
            <div className="text-center space-y-2">
              <Button
                variant="ghost"
                className="text-lg font-semibold"
                onClick={() => setShowExercisePicker(true)}
              >
                {currentExercise.name}
              </Button>
              <div className="flex justify-center">
                <ProgressionBadge exerciseId={currentExercise.id} />
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-14"
              onClick={() => setShowExercisePicker(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Exercise
            </Button>
          )}

          {currentExercise && (
            <>
              <SetLogger
                weight={weight}
                reps={reps}
                rpe={rpe}
                lastWeight={
                  lastSetsQuery.data?.[0]?.weight
                    ? Number(lastSetsQuery.data[0].weight)
                    : undefined
                }
                lastReps={lastSetsQuery.data?.[0]?.reps ?? undefined}
                onWeightChange={setWeight}
                onRepsChange={setReps}
                onRpeChange={setRpe}
              />

              <Button
                className="w-full h-14 text-lg"
                disabled={isLogging || reps <= 0}
                onClick={handleLogSet}
              >
                {isLogging ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                Log Set
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowExercisePicker(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Switch Exercise
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rest timer */}
      <div className="fixed bottom-0 left-0 right-0 z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <RestTimer
          isRunning={timer.isRunning}
          secondsLeft={timer.secondsLeft}
          progress={timer.progress}
          onStart={timer.start}
          onStop={timer.stop}
        />
      </div>

      {/* Exercise picker */}
      <ExercisePicker
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={ex => {
          setCurrentExercise({ id: ex.id, name: ex.name });
          setWeight(0);
          setReps(0);
          setRpe(undefined);
        }}
      />

      {/* Discard confirmation */}
      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              All logged sets will be lost. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Going</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Workout summary */}
      <WorkoutSummary
        open={!!summaryData}
        onClose={() => {
          setSummaryData(null);
          setLocation("/dashboard");
        }}
        data={summaryData}
      />
    </div>
  );
}
