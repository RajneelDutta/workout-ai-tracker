import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import WorkoutLogger from "./pages/WorkoutLogger";
import ProgressTracking from "./pages/ProgressTracking";
import AIInsights from "./pages/AIInsights";
import Profile from "./pages/Profile";
import ActiveWorkout from "./pages/ActiveWorkout";
import CharacterPage from "./pages/CharacterPage";
import Templates from "./pages/Templates";
import Import from "./pages/Import";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>{() => <Redirect to="/dashboard" />}</Route>
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/workout"} component={ActiveWorkout} />
      <Route path={"/workout-logger"} component={WorkoutLogger} />
      <Route path={"/progress"} component={ProgressTracking} />
      <Route path={"/ai-insights"} component={AIInsights} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/character"} component={CharacterPage} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/import"} component={Import} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <ReloadPrompt />
          <OfflineIndicator />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
