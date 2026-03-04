import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface SetEntry {
  exerciseId: number;
  exerciseName: string;
  reps: number;
  weight?: number;
  duration?: number;
  rpe?: number;
  notes?: string;
}

export default function WorkoutLogger() {
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("");
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exercisesQuery = trpc.exercises.list.useQuery(undefined, { enabled: !!user });
  const createWorkoutMutation = trpc.workouts.create.useMutation();
  const createSetMutation = trpc.sets.create.useMutation();

  const handleAddSet = () => {
    setSets([
      ...sets,
      {
        exerciseId: 0,
        exerciseName: "",
        reps: 0,
        weight: undefined,
        duration: undefined,
        rpe: undefined,
        notes: "",
      },
    ]);
  };

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleSetChange = (index: number, field: string, value: any) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const handleExerciseChange = (index: number, exerciseId: number) => {
    const exercise = exercisesQuery.data?.find((e) => e.id === exerciseId);
    handleSetChange(index, "exerciseId", exerciseId);
    if (exercise) {
      handleSetChange(index, "exerciseName", exercise.name);
    }
  };

  const handleSubmit = async () => {
    if (!workoutName.trim()) {
      toast.error("Please enter a workout name");
      return;
    }

    if (sets.length === 0) {
      toast.error("Please add at least one set");
      return;
    }

    setIsSubmitting(true);
    try {
      const workoutResult = await createWorkoutMutation.mutateAsync({
        name: workoutName,
        date: new Date(workoutDate),
        duration: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
      });

      const workoutId = (workoutResult as any).insertId || (workoutResult as any)[0]?.insertId;

      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        await createSetMutation.mutateAsync({
          workoutId,
          exerciseId: set.exerciseId,
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          rpe: set.rpe,
          notes: set.notes,
          order: i + 1,
        });
      }

      toast.success("Workout logged successfully!");
      setWorkoutName("");
      setDuration("");
      setNotes("");
      setSets([]);
      setWorkoutDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      toast.error("Failed to log workout");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Log Workout</h1>
        <p className="text-muted-foreground mt-1">Record your training session</p>
      </div>

      {/* Live workout banner */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
        <div>
          <p className="font-medium">Want to track in real-time?</p>
          <p className="text-sm text-muted-foreground">
            Log sets as you go with rest timers
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setLocation("/workout")}
        >
          Start Live Workout
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Workout Details */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>Basic information about your session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                placeholder="e.g., Upper Body Push"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="How did you feel? Any observations?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sets Summary */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Sets Summary</CardTitle>
            <CardDescription>Total sets: {sets.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {sets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sets added yet</p>
            ) : (
              <div className="space-y-2">
                {sets.map((set, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium">{set.exerciseName || "Exercise"}</p>
                    <p className="text-muted-foreground">
                      {set.reps} reps {set.weight && `@ ${set.weight} lbs`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sets Editor */}
      <Card className="border border-border/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Exercises</CardTitle>
              <CardDescription>Add exercises and sets to your workout</CardDescription>
            </div>
            <Button onClick={handleAddSet} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Set
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No sets added yet</p>
              <Button onClick={handleAddSet} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Set
              </Button>
            </div>
          ) : (
            sets.map((set, i) => (
              <div key={i} className="p-4 rounded-lg border border-border/50 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Set {i + 1}</h4>
                  <Button
                    onClick={() => handleRemoveSet(i)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exercise</Label>
                    <Select
                      value={set.exerciseId.toString()}
                      onValueChange={(value) => handleExerciseChange(i, parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercisesQuery.data?.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id.toString()}>
                            {exercise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={set.reps}
                      onChange={(e) => handleSetChange(i, "reps", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Weight (lbs)</Label>
                    <Input
                      type="number"
                      placeholder="185"
                      value={set.weight || ""}
                      onChange={(e) => handleSetChange(i, "weight", e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>RPE (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="8"
                      value={set.rpe || ""}
                      onChange={(e) => handleSetChange(i, "rpe", e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Any notes for this set?"
                      value={set.notes || ""}
                      onChange={(e) => handleSetChange(i, "notes", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || createWorkoutMutation.isPending}
          className="gap-2"
        >
          {isSubmitting || createWorkoutMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Workout"
          )}
        </Button>
      </div>
    </div>
  );
}
