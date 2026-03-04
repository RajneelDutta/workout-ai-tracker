import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: number; name: string; category: string }) => void;
};

export function ExercisePicker({ open, onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const exercisesQuery = trpc.exercises.list.useQuery();
  const createMutation = trpc.exercises.create.useMutation({
    onSuccess: () => {
      exercisesQuery.refetch();
      setNewName("");
      setShowCreate(false);
    },
  });

  const exercises = exercisesQuery.data ?? [];
  const filtered = search
    ? exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  const categoryColors: Record<string, string> = {
    strength: "bg-red-500/10 text-red-600",
    cardio: "bg-green-500/10 text-green-600",
    flexibility: "bg-purple-500/10 text-purple-600",
    sports: "bg-blue-500/10 text-blue-600",
    other: "bg-gray-500/10 text-gray-600",
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        name: newName.trim(),
        category: "strength",
        muscleGroups: [],
        isCustom: true,
      });
      const id = (result as any).insertId ?? (result as any)[0]?.insertId;
      onSelect({ id, name: newName.trim(), category: "strength" });
      onClose();
    } catch {
      toast.error("Failed to create exercise");
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Add Exercise</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-y-auto max-h-[55vh] space-y-1">
            {filtered.map(ex => (
              <button
                key={ex.id}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => {
                  onSelect({
                    id: ex.id,
                    name: ex.name,
                    category: ex.category,
                  });
                  onClose();
                }}
              >
                <span className="font-medium">{ex.name}</span>
                <Badge
                  variant="secondary"
                  className={categoryColors[ex.category] ?? ""}
                >
                  {ex.category}
                </Badge>
              </button>
            ))}

            {filtered.length === 0 && !showCreate && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-3">No exercises found</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreate(true);
                    setNewName(search);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </div>
            )}
          </div>

          {!showCreate && filtered.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Exercise
            </Button>
          )}

          {showCreate && (
            <div className="flex gap-2">
              <Input
                placeholder="Exercise name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
