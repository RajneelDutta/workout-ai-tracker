import { CloudOff } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function OfflineIndicator() {
  const { isOnline } = useOfflineSync();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-destructive-foreground text-sm font-medium shadow-lg">
      <CloudOff className="h-4 w-4" />
      Offline
    </div>
  );
}
