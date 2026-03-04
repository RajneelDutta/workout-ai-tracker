import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import {
  LogOut,
  Dumbbell,
  Target,
  Trophy,
  Flame,
  Volume2,
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

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
  const profileQuery = trpc.character.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const profile = profileQuery.data;

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
              <p className="text-xl font-semibold">
                {user?.name || "User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email || ""}
              </p>
              {profile && (
                <p className="text-sm mt-1">
                  Level {profile.level} {profile.title} —{" "}
                  {profile.totalXp.toLocaleString()} XP
                </p>
              )}
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
        {profile && profile.streak > 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Flame className="h-8 w-8 mx-auto text-orange-500 mb-1" />
              <p className="text-4xl font-bold text-orange-500">
                {profile.streak}
              </p>
              <p className="text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Sound Effects</span>
              </div>
              <Switch
                checked={soundOn}
                onCheckedChange={v => {
                  setSoundOn(v);
                  setSoundEnabled(v);
                }}
              />
            </div>
          </CardContent>
        </Card>

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
