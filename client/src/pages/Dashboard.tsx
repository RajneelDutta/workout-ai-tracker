import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { CharacterCard } from "@/components/rpg/CharacterCard";
import { BossFight } from "@/components/rpg/BossFight";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  TrendingUp,
  Zap,
  Target,
  Trophy,
  CalendarCheck,
  Star,
  Award,
  LayoutTemplate,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { WorkoutDetail } from "@/components/workout/WorkoutDetail";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null
  );
  const workoutsQuery = trpc.workouts.list.useQuery(
    { limit: 5 },
    { enabled: !!user }
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

  const templatesQuery = trpc.templates.list.useQuery(undefined, {
    enabled: !!user,
  });

  const todayQuery = trpc.programs.getToday.useQuery(undefined, {
    enabled: !!user,
  });

  const badgesQuery = trpc.character.getBadges.useQuery(undefined, {
    enabled: !!user,
  });

  const xpHistoryQuery = trpc.character.getXPHistory.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );

  // Auto-migrate on first load if profile has no XP
  const migrateMutation = trpc.character.migrate.useMutation({
    onSuccess: () => profileQuery.refetch(),
  });

  useEffect(() => {
    if (
      profileQuery.data &&
      profileQuery.data.totalXp === 0 &&
      (workoutsQuery.data?.length ?? 0) > 0 &&
      !migrateMutation.isPending
    ) {
      migrateMutation.mutate();
    }
  }, [profileQuery.data, workoutsQuery.data]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name}!
            </h1>
            {profile && (
              <p className="text-muted-foreground mt-1">
                Level {profile.level} {profile.title}{" "}
                {profile.totalXp.toLocaleString()} XP
              </p>
            )}
          </div>
          <Button className="gap-2" onClick={() => setLocation("/workout")}>
            <Plus className="h-4 w-4" />
            Start Workout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workoutsQuery.data?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goalsQuery.data?.filter(g => g.status === "active").length ||
                  0}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                PRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {prsQuery.data?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.totalXp.toLocaleString() ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Character + Boss */}
          <div className="lg:col-span-1 space-y-4">
            <button
              className="w-full text-left"
              onClick={() => setLocation("/character")}
            >
              <CharacterCard />
            </button>
            <BossFight />
          </div>

          {/* Right column — Today + Recent Workouts + Goals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Workout */}
            {todayQuery.data?.template && (
              <Card className="border border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    Today's Workout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {todayQuery.data.template.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {todayQuery.data.template.exercises.length} exercises
                        {todayQuery.data.template.estimatedDuration &&
                          ` • ~${todayQuery.data.template.estimatedDuration} min`}
                      </p>
                    </div>
                    <Button onClick={() => setLocation("/workout")}>
                      <Zap className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Templates */}
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-violet-500" />
                  My Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templatesQuery.data && templatesQuery.data.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {templatesQuery.data.length} template
                      {templatesQuery.data.length !== 1 ? "s" : ""} saved
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/templates")}
                    >
                      View All
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Create reusable workout templates
                    </p>
                    <Button
                      className="mt-3"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/templates")}
                    >
                      Create Your First Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            {(badgesQuery.data?.unlocked?.length ?? 0) > 0 && (
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {badgesQuery.data?.unlocked?.slice(0, 6).map((b: any) => {
                      const def = badgesQuery.data?.definitions?.find(
                        (d: any) => d.id === b.badgeId
                      );
                      return (
                        <Badge
                          key={b.badgeId}
                          variant="secondary"
                          className="gap-1.5 py-1.5 px-3"
                        >
                          <Star className="h-3 w-3 text-yellow-500" />
                          {def?.title ?? b.badgeId}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>Recent Workouts</CardTitle>
                <CardDescription>Your latest training sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {workoutsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6" />
                  </div>
                ) : workoutsQuery.data && workoutsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {workoutsQuery.data.map(workout => (
                      <div
                        key={workout.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{workout.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(workout.date).toLocaleDateString()} •{" "}
                            {workout.duration || "—"} min
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWorkoutId(workout.id)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No workouts yet. Start your first workout!
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => setLocation("/workout")}
                    >
                      Start Workout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Goals */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>Active Goals</CardTitle>
                <CardDescription>Your fitness objectives</CardDescription>
              </CardHeader>
              <CardContent>
                {goalsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6" />
                  </div>
                ) : goalsQuery.data && goalsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {goalsQuery.data
                      .filter(g => g.status === "active")
                      .slice(0, 3)
                      .map(goal => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{goal.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {goal.currentValue} / {goal.targetValue}{" "}
                              {goal.unit}
                            </p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  (parseFloat(goal.currentValue || "0") /
                                    parseFloat(goal.targetValue)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No goals yet. Set your first goal!
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => setLocation("/progress")}
                    >
                      Create Goal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <WorkoutDetail
        workoutId={selectedWorkoutId}
        open={selectedWorkoutId !== null}
        onClose={() => setSelectedWorkoutId(null)}
      />
    </DashboardLayout>
  );
}
