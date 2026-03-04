import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Skull, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BossFight() {
  const bossQuery = trpc.character.getActiveBossFights.useQuery();
  const spawnMutation = trpc.character.spawnBoss.useMutation({
    onSuccess: () => bossQuery.refetch(),
  });

  if (bossQuery.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const bosses = bossQuery.data ?? [];

  if (bosses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Skull className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            No active boss fights
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={spawnMutation.isPending}
            onClick={async () => {
              try {
                await spawnMutation.mutateAsync();
                toast.success("A new boss appears!");
              } catch {
                toast.error("Failed to spawn boss");
              }
            }}
          >
            {spawnMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Skull className="h-4 w-4 mr-2" />
            )}
            Challenge a Boss
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bosses.map(boss => {
        const pct = Math.min(
          100,
          Math.round((boss.currentValue / boss.targetValue) * 100)
        );
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (new Date(boss.expiresAt).getTime() - Date.now()) / 86400000
          )
        );

        return (
          <Card key={boss.id} className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Skull className="h-4 w-4 text-red-500" />
                  <span className="font-bold text-sm">{boss.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  {boss.xpReward} XP
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {boss.description}
              </p>
              <div className="flex items-center gap-2">
                <Progress value={pct} className="flex-1 h-2" />
                <span className="text-xs font-mono">
                  {boss.currentValue}/{boss.targetValue}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {daysLeft}d remaining
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
