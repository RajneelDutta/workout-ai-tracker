import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Brain,
  User,
} from "lucide-react";
import { useLocation } from "wouter";

const tabs = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
  { icon: Dumbbell, label: "Workout", path: "/workout", primary: true },
  { icon: Brain, label: "AI", path: "/ai-insights" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const isActive =
            location === tab.path ||
            (tab.path === "/workout" && location.startsWith("/workout"));
          return (
            <button
              key={tab.path}
              onClick={() => setLocation(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] transition-colors ${
                tab.primary
                  ? "relative -mt-4"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
              }`}
            >
              {tab.primary ? (
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/90 text-primary-foreground"
                  }`}
                >
                  <tab.icon className="h-6 w-6" />
                </div>
              ) : (
                <tab.icon className="h-5 w-5" />
              )}
              <span
                className={`text-[10px] font-medium ${tab.primary ? "mt-0.5" : ""}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
