import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const TIER_THRESHOLDS = [
  { tier: "novice", threshold: 0, next: 500 },
  { tier: "intermediate", threshold: 500, next: 2000 },
  { tier: "advanced", threshold: 2000, next: 5000 },
  { tier: "master", threshold: 5000, next: 5000 },
];

const tierColors: Record<string, string> = {
  novice: "bg-gray-500/10 text-gray-600",
  intermediate: "bg-blue-500/10 text-blue-600",
  advanced: "bg-purple-500/10 text-purple-600",
  master: "bg-yellow-500/10 text-yellow-600",
};

export function SkillTree() {
  const skillQuery = trpc.character.getSkillTree.useQuery();

  if (skillQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const skills = skillQuery.data ?? [];

  if (skills.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Complete workouts to unlock skill nodes
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {skills.map(skill => {
        const tierInfo = TIER_THRESHOLDS.find(t => t.tier === skill.tier);
        const nextThreshold = tierInfo?.next ?? 5000;
        const currentInTier = skill.xp - (tierInfo?.threshold ?? 0);
        const tierRange = nextThreshold - (tierInfo?.threshold ?? 0);
        const pct =
          skill.tier === "master"
            ? 100
            : Math.min(100, Math.round((currentInTier / tierRange) * 100));

        return (
          <Card key={skill.id} className="border-border/50">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">
                  {skill.muscleGroup}
                </span>
                <Badge
                  variant="secondary"
                  className={tierColors[skill.tier] ?? ""}
                >
                  {skill.tier}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={pct} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground">
                  {skill.xp} XP
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
