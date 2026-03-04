import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Shield } from "lucide-react";

export function CharacterCard() {
  const profileQuery = trpc.character.getProfile.useQuery();
  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  // Calculate XP progress to next level
  const xpForLevel = (n: number) =>
    n <= 1 ? 0 : Math.floor(100 * Math.pow(n, 1.5));
  let cumPrev = 0;
  for (let i = 2; i <= profile.level; i++) cumPrev += xpForLevel(i);
  const cumNext = cumPrev + xpForLevel(profile.level + 1);
  const xpInLevel = profile.totalXp - cumPrev;
  const xpNeeded = cumNext - cumPrev;
  const progressPct =
    xpNeeded > 0
      ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))
      : 100;

  const stats = [
    { label: "STR", value: profile.statSTR, color: "text-red-500" },
    { label: "END", value: profile.statEND, color: "text-green-500" },
    { label: "AGI", value: profile.statAGI, color: "text-blue-500" },
    { label: "FLX", value: profile.statFLX, color: "text-purple-500" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">Lv. {profile.level}</span>
            <Badge variant="secondary" className="text-xs">
              {profile.title}
            </Badge>
            {profile.prestigeLevel > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-yellow-500 text-yellow-600"
              >
                P{profile.prestigeLevel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={progressPct} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {profile.totalXp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
      <CardContent className="pt-3 pb-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className={`text-xs font-bold ${s.color}`}>{s.label}</p>
              <p className="text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
