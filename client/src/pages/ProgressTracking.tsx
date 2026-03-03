import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

export default function ProgressTracking() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");

  const analyticsQuery = trpc.analytics.getStats.useQuery(
    {
      startDate: new Date(Date.now() - (dateRange === "week" ? 7 : dateRange === "month" ? 30 : 365) * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    { enabled: !!user }
  );

  const workoutsQuery = trpc.workouts.list.useQuery({ limit: 100 }, { enabled: !!user });

  // Prepare data for charts
  const workoutsByDay = workoutsQuery.data?.reduce((acc, workout) => {
    const date = new Date(workout.date).toLocaleDateString();
    const existing = acc.find((d) => d.date === date);
    if (existing) {
      existing.count += 1;
      existing.volume += parseFloat(workout.totalVolume || "0");
    } else {
      acc.push({ date, count: 1, volume: parseFloat(workout.totalVolume || "0") });
    }
    return acc;
  }, [] as Array<{ date: string; count: number; volume: number }>) || [];

  const workoutsByType = workoutsQuery.data?.reduce((acc, workout) => {
    const existing = acc.find((w) => w.name === workout.name);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: workout.name, count: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; count: number }>) || [];

  const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progress Tracking</h1>
        <p className="text-muted-foreground mt-1">Visualize your fitness journey</p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {(["week", "month", "year"] as const).map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? "default" : "outline"}
            onClick={() => setDateRange(range)}
            className="capitalize"
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutsQuery.data?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In {dateRange}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workoutsByDay.length > 0
                ? (workoutsByDay.reduce((sum, d) => sum + d.volume, 0) / workoutsByDay.length).toFixed(0)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per workout</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workoutsByDay.length > 0
                ? Math.round((workoutsByDay.length / (dateRange === "week" ? 7 : dateRange === "month" ? 30 : 365)) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Workout frequency</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workout Frequency Chart */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Workout Frequency</CardTitle>
            <CardDescription>Workouts per day</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : workoutsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={workoutsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Workouts" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Volume Progression Chart */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Volume Progression</CardTitle>
            <CardDescription>Total volume per day</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : workoutsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workoutsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="volume" fill="#06b6d4" name="Volume (lbs)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Workout Type Distribution */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Workout Types</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            {workoutsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={workoutsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {workoutsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Key metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Total Workouts</span>
              <span className="text-lg font-bold">{workoutsQuery.data?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Total Volume</span>
              <span className="text-lg font-bold">
                {workoutsByDay.reduce((sum, d) => sum + d.volume, 0).toFixed(0)} lbs
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Avg Workout Duration</span>
              <span className="text-lg font-bold">
                {workoutsQuery.data && workoutsQuery.data.length > 0
                  ? Math.round(workoutsQuery.data.reduce((sum, w) => sum + (w.duration || 0), 0) / workoutsQuery.data.length)
                  : 0}{" "}
                min
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Workout Types</span>
              <span className="text-lg font-bold">{workoutsByType.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Export Data
        </Button>
      </div>
    </div>
  );
}
