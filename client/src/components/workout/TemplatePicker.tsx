import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Dumbbell, Star, Clock } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: number) => void;
  onBlank: () => void;
};

export function TemplatePicker({
  open,
  onClose,
  onSelectTemplate,
  onBlank,
}: Props) {
  const templatesQuery = trpc.templates.list.useQuery();
  const todayQuery = trpc.programs.getToday.useQuery();

  const templates = templatesQuery.data ?? [];
  const todayTemplate = todayQuery.data?.template;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Start Workout</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto max-h-[55vh]">
          {/* Blank workout */}
          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3"
            onClick={() => {
              onBlank();
              onClose();
            }}
          >
            <Dumbbell className="h-5 w-5" />
            <div className="text-left">
              <p className="font-medium">Blank Workout</p>
              <p className="text-xs text-muted-foreground">
                Start from scratch
              </p>
            </div>
          </Button>

          {/* Today's programmed workout */}
          {todayTemplate && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Today's Program
              </p>
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3 border-primary/50 bg-primary/5"
                onClick={() => {
                  onSelectTemplate(todayTemplate.id);
                  onClose();
                }}
              >
                <Star className="h-5 w-5 text-primary" />
                <div className="text-left flex-1">
                  <p className="font-medium">{todayTemplate.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {todayTemplate.exercises.length} exercises
                    {todayTemplate.estimatedDuration &&
                      ` • ${todayTemplate.estimatedDuration}m`}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Scheduled
                </Badge>
              </Button>
            </div>
          )}

          {/* All templates */}
          {templatesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : templates.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Templates
              </p>
              <div className="space-y-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => {
                      onSelectTemplate(t.id);
                      onClose();
                    }}
                  >
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.exerciseCount} exercises
                        {t.category && ` • ${t.category}`}
                      </p>
                    </div>
                    {t.estimatedDuration && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t.estimatedDuration}m
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
