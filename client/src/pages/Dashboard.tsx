import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, TrendingUp, Zap, Target, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const workoutsQuery = trpc.workouts.list.useQuery(
    { limit: 5 },
    { enabled: !!user }
  );

  const goalsQuery = trpc.goals.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground mt-1">Track your fitness journey with AI-powered insights</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Workout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workoutsQuery.data?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goalsQuery.data?.filter((g) => g.status === "active").length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Achievements</p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Workouts */}
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
                {workoutsQuery.data.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workout.date).toLocaleDateString()} • {workout.duration || "—"} min
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No workouts yet. Start your first workout!</p>
                <Button className="mt-4" variant="outline">
                  Create Workout
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
                  .filter((g) => g.status === "active")
                  .slice(0, 3)
                  .map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (parseFloat(goal.currentValue || "0") / parseFloat(goal.targetValue)) * 100,
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
                <p className="text-muted-foreground">No goals yet. Set your first goal!</p>
                <Button className="mt-4" variant="outline">
                  Create Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
