import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { computeGamificationState } from "@/lib/gamification";
import { LogOut, Dumbbell, Target, Trophy } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();

  const workoutsQuery = trpc.workouts.list.useQuery(
    { limit: 999 },
    { enabled: !!user },
  );
  const goalsQuery = trpc.goals.list.useQuery(undefined, {
    enabled: !!user,
  });
  const prsQuery = trpc.personalRecords.list.useQuery(undefined, {
    enabled: !!user,
  });

  const gamification = computeGamificationState(
    (workoutsQuery.data ?? []).map(w => ({
      id: w.id,
      date: new Date(w.date),
      totalVolume: w.totalVolume ? Number(w.totalVolume) : null,
    })),
    (prsQuery.data ?? []).map(pr => ({
      achievedAt: new Date(pr.achievedAt),
    })),
    (goalsQuery.data ?? []).map(g => ({
      status: g.status,
      completedAt: g.completedAt ? new Date(g.completedAt) : null,
    })),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Profile</h1>

        {/* User Card */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="h-16 w-16 border-2">
              <AvatarFallback className="text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xl font-semibold">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">
                {user?.email || ""}
              </p>
              <p className="text-sm mt-1">
                Level {gamification.level.level} {gamification.level.emoji}{" "}
                {gamification.level.title} — {gamification.xp.toLocaleString()}{" "}
                XP
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <Dumbbell className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">
                {workoutsQuery.data?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">
                {prsQuery.data?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">PRs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <Target className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">
                {goalsQuery.data?.filter(g => g.status === "completed")
                  .length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Goals Done</p>
            </CardContent>
          </Card>
        </div>

        {/* Streak */}
        {gamification.streak > 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-4xl font-bold text-orange-500">
                {gamification.streak}
              </p>
              <p className="text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </DashboardLayout>
  );
}
