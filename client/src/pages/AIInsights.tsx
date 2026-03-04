import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Zap, TrendingUp, Heart, Brain } from "lucide-react";
import { toast } from "sonner";

export default function AIInsights() {
  const { user } = useAuth();

  const insightsQuery = trpc.aiInsights.list.useQuery({ limit: 20 }, { enabled: !!user });
  const analyzeWorkoutMutation = trpc.aiInsights.analyzeWorkout.useMutation();
  const getSuggestionsMutation = trpc.aiInsights.getSuggestions.useMutation();
  const getProgressMutation = trpc.aiInsights.getProgressInsights.useMutation();
  const getRecoveryMutation = trpc.aiInsights.getRecoveryRecommendations.useMutation();

  const handleGenerateInsight = async (type: "suggestions" | "progress" | "recovery") => {
    try {
      let result;
      if (type === "suggestions") {
        result = await getSuggestionsMutation.mutateAsync();
      } else if (type === "progress") {
        result = await getProgressMutation.mutateAsync();
      } else {
        result = await getRecoveryMutation.mutateAsync();
      }
      toast.success("Insight generated!");
      insightsQuery.refetch();
    } catch (error) {
      toast.error("Failed to generate insight");
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "performance":
        return <Zap className="h-5 w-5 text-amber-500" />;
      case "suggestion":
        return <Brain className="h-5 w-5 text-blue-500" />;
      case "recovery":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "trend":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Insights</h1>
        <p className="text-muted-foreground mt-1">Personalized fitness analysis and recommendations</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border border-border/50 hover:border-border transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Workout Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Get AI-powered workout ideas based on your history</p>
            <Button
              onClick={() => handleGenerateInsight("suggestions")}
              disabled={getSuggestionsMutation.isPending}
              size="sm"
              className="w-full"
            >
              {getSuggestionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-border transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Progress Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Analyze your 30-day progress and trends</p>
            <Button
              onClick={() => handleGenerateInsight("progress")}
              disabled={getProgressMutation.isPending}
              size="sm"
              className="w-full"
            >
              {getProgressMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-border transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Recovery Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Get personalized recovery recommendations</p>
            <Button
              onClick={() => handleGenerateInsight("recovery")}
              disabled={getRecoveryMutation.isPending}
              size="sm"
              className="w-full"
            >
              {getRecoveryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Get Tips"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
          <CardDescription>Your latest AI-generated fitness insights</CardDescription>
        </CardHeader>
        <CardContent>
          {insightsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : insightsQuery.data && insightsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {insightsQuery.data.map((insight) => (
                <div key={insight.id} className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-semibold">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(insight.createdAt).toLocaleDateString()} at{" "}
                            {new Date(insight.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded capitalize whitespace-nowrap">{insight.type}</span>
                      </div>
                      <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">{insight.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No insights yet. Generate one to get started!</p>
              <Button onClick={() => handleGenerateInsight("suggestions")}>Generate First Insight</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle>How AI Insights Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-semibold">
              1
            </div>
            <div>
              <p className="font-medium">Log Your Workouts</p>
              <p className="text-sm text-muted-foreground">Record your exercises, sets, reps, and weights</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-semibold">
              2
            </div>
            <div>
              <p className="font-medium">AI Analysis</p>
              <p className="text-sm text-muted-foreground">Our AI analyzes your patterns and performance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-semibold">
              3
            </div>
            <div>
              <p className="font-medium">Get Recommendations</p>
              <p className="text-sm text-muted-foreground">Receive personalized suggestions to improve your fitness</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
