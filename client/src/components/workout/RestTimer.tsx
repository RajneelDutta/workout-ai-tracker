import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const PRESETS = [60, 90, 120, 180];

type Props = {
  isRunning: boolean;
  secondsLeft: number;
  progress: number;
  onStart: (seconds: number) => void;
  onStop: () => void;
};

export function RestTimer({
  isRunning,
  secondsLeft,
  progress,
  onStart,
  onStop,
}: Props) {
  if (!isRunning && secondsLeft === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/50">
        <span className="text-sm text-muted-foreground mr-2">Rest:</span>
        {PRESETS.map(s => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            className="h-8 min-w-[48px]"
            onClick={() => onStart(s)}
          >
            {s >= 60 ? `${s / 60}m` : `${s}s`}
          </Button>
        ))}
      </div>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="px-4 py-3 border-t bg-primary/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Rest Timer</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onStop}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-mono font-bold tabular-nums">
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
