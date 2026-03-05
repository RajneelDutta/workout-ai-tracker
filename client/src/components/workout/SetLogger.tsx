import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Flame } from "lucide-react";

type Props = {
  weight: number;
  reps: number;
  rpe: number | undefined;
  lastWeight?: number;
  lastReps?: number;
  onWeightChange: (w: number) => void;
  onRepsChange: (r: number) => void;
  onRpeChange: (r: number | undefined) => void;
};

function StepButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-12 w-12 rounded-full text-lg font-bold shrink-0"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SetLogger({
  weight,
  reps,
  rpe,
  lastWeight,
  lastReps,
  onWeightChange,
  onRepsChange,
  onRpeChange,
}: Props) {
  return (
    <div className="space-y-6 py-2">
      {/* Last time hint */}
      {lastWeight !== undefined && lastReps !== undefined && (
        <p className="text-center text-sm text-muted-foreground">
          Last time: {lastWeight} kg x {lastReps} reps
        </p>
      )}

      {/* Weight */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center block">
          Weight (kg)
        </label>
        <div className="flex items-center justify-center gap-4">
          <StepButton onClick={() => onWeightChange(Math.max(0, weight - 5))}>
            <Minus className="h-5 w-5" />
          </StepButton>
          <span className="text-4xl font-bold tabular-nums w-24 text-center">
            {weight}
          </span>
          <StepButton onClick={() => onWeightChange(weight + 5)}>
            <Plus className="h-5 w-5" />
          </StepButton>
        </div>
      </div>

      {/* Reps */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center block">
          Reps
        </label>
        <div className="flex items-center justify-center gap-4">
          <StepButton onClick={() => onRepsChange(Math.max(0, reps - 1))}>
            <Minus className="h-5 w-5" />
          </StepButton>
          <span className="text-4xl font-bold tabular-nums w-24 text-center">
            {reps}
          </span>
          <StepButton onClick={() => onRepsChange(reps + 1)}>
            <Plus className="h-5 w-5" />
          </StepButton>
        </div>
      </div>

      {/* RPE */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center block">
          RPE (optional)
        </label>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {[6, 7, 8, 9, 10].map(v => (
            <Badge
              key={v}
              variant={rpe === v ? "default" : "outline"}
              className="cursor-pointer min-w-[40px] min-h-[36px] justify-center text-sm"
              onClick={() => onRpeChange(rpe === v ? undefined : v)}
            >
              {v === 10 && <Flame className="h-3 w-3 mr-0.5" />}
              {v}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
