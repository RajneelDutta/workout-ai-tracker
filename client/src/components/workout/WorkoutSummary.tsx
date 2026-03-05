import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Clock, Dumbbell, Flame, Sparkles } from "lucide-react";

type RPGResult = {
  xpGained: number;
  newLevel: number;
  newTitle: string;
  leveledUp: boolean;
  previousLevel: number;
  newBadges: string[];
  transactions: Array<{ amount: number; reason: string }>;
} | null;

type Props = {
  open: boolean;
  onClose: () => void;
  data: {
    duration: number;
    totalVolume: number;
    totalSets: number;
    newPRs: Array<{ exerciseId: number; weight: number }>;
    rpg?: RPGResult;
  } | null;
};

export function WorkoutSummary({ open, onClose, data }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Workout Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-center space-y-1 p-4 rounded-lg bg-muted/50">
            <Clock className="h-6 w-6 mx-auto text-blue-500" />
            <p className="text-2xl font-bold">{data.duration}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
          <div className="text-center space-y-1 p-4 rounded-lg bg-muted/50">
            <Dumbbell className="h-6 w-6 mx-auto text-primary" />
            <p className="text-2xl font-bold">{data.totalSets}</p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div className="text-center space-y-1 p-4 rounded-lg bg-muted/50">
            <Flame className="h-6 w-6 mx-auto text-orange-500" />
            <p className="text-2xl font-bold">
              {data.totalVolume.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">kg Volume</p>
          </div>
          {data.newPRs.length > 0 && (
            <div className="text-center space-y-1 p-4 rounded-lg bg-yellow-500/10">
              <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
              <p className="text-2xl font-bold">{data.newPRs.length}</p>
              <p className="text-xs text-muted-foreground">New PRs!</p>
            </div>
          )}
        </div>

        {/* RPG XP Summary */}
        {data.rpg && data.rpg.xpGained > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold text-primary">
                +{data.rpg.xpGained} XP
              </span>
            </div>
            {data.rpg.leveledUp && (
              <p className="text-center font-semibold text-sm">
                Level Up! {data.rpg.previousLevel} → {data.rpg.newLevel}
              </p>
            )}
            {data.rpg.newBadges.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {data.rpg.newBadges.length} new badge
                {data.rpg.newBadges.length > 1 ? "s" : ""} unlocked!
              </p>
            )}
            <div className="space-y-1">
              {data.rpg.transactions.map((tx, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>{tx.reason}</span>
                  <span className="font-medium">+{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
