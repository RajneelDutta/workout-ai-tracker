import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { Loader2, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

type TemplateExEntry = {
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  restDuration?: number;
  notes?: string;
};

type Props = {
  templateId?: number;
  onClose: () => void;
};

export function TemplateEditor({ templateId, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<TemplateExEntry[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = templateId !== undefined;
  const templateQuery = trpc.templates.get.useQuery(
    { id: templateId! },
    { enabled: isEditing }
  );
  const exercisesQuery = trpc.exercises.list.useQuery();
  const createMutation = trpc.templates.create.useMutation();
  const updateMutation = trpc.templates.update.useMutation();

  // Load existing template data
  useEffect(() => {
    if (templateQuery.data) {
      const t = templateQuery.data;
      setName(t.name);
      setDescription(t.description ?? "");
      setCategory(t.category ?? "");
      setDuration(t.estimatedDuration?.toString() ?? "");
      const exMap = new Map(
        (exercisesQuery.data ?? []).map(e => [e.id, e.name])
      );
      setExercises(
        t.exercises.map(e => ({
          exerciseId: e.exerciseId,
          exerciseName: exMap.get(e.exerciseId) ?? "Exercise",
          targetSets: e.targetSets,
          targetReps: e.targetReps ?? undefined,
          targetWeight: e.targetWeight ? Number(e.targetWeight) : undefined,
          restDuration: e.restDuration ?? undefined,
          notes: e.notes ?? undefined,
        }))
      );
    }
  }, [templateQuery.data, exercisesQuery.data]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Enter a template name");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description || undefined,
        category: category || undefined,
        estimatedDuration: duration ? parseInt(duration) : undefined,
        exercises: exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          order: i + 1,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetWeight: e.targetWeight,
          restDuration: e.restDuration,
          notes: e.notes,
        })),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: templateId!, ...payload });
        toast.success("Template updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Template created");
      }
      onClose();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const addExercise = (ex: { id: number; name: string; category: string }) => {
    setExercises(prev => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetSets: 3,
        targetReps: 10,
      },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (
    idx: number,
    field: keyof TemplateExEntry,
    value: any
  ) => {
    setExercises(prev =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  return (
    <Sheet open onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Edit Template" : "New Template"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Push Day"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Push, Pull, Legs..."
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Notes about this template..."
              rows={2}
            />
          </div>

          {/* Exercise list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises added
              </p>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {ex.exerciseName}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => removeExercise(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          value={ex.targetSets}
                          onChange={e =>
                            updateExercise(
                              i,
                              "targetSets",
                              parseInt(e.target.value) || 3
                            )
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          value={ex.targetReps ?? ""}
                          onChange={e =>
                            updateExercise(
                              i,
                              "targetReps",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                          className="h-8"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weight</Label>
                        <Input
                          type="number"
                          value={ex.targetWeight ?? ""}
                          onChange={e =>
                            updateExercise(
                              i,
                              "targetWeight",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          className="h-8"
                          placeholder="lbs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Update Template" : "Create Template"}
          </Button>
        </div>

        <ExercisePicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={addExercise}
        />
      </SheetContent>
    </Sheet>
  );
}
