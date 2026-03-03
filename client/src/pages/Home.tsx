import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, TrendingUp, Target, Brain } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Zap className="h-6 w-6 text-amber-500" />
            Workout AI Tracker
          </div>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Your Personal AI Fitness Coach
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Track workouts, analyze performance, and get personalized AI-powered insights to achieve your fitness goals faster.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={Zap}
            title="Smart Logging"
            description="Log workouts in seconds with our intuitive interface"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Progress Tracking"
            description="Visualize your fitness journey with detailed analytics"
          />
          <FeatureCard
            icon={Target}
            title="Goal Setting"
            description="Set and track fitness goals with AI recommendations"
          />
          <FeatureCard
            icon={Brain}
            title="AI Insights"
            description="Get personalized analysis and workout suggestions"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your fitness?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Join thousands of users already achieving their fitness goals with AI-powered insights.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-20 py-8 text-center text-slate-400">
        <p>&copy; 2026 Workout AI Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <Icon className="h-8 w-8 text-blue-400 mb-4" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
