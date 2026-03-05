import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useEffect } from "react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (needRefresh) {
      toast("New version available", {
        description: "Click to update the app.",
        duration: Infinity,
        action: {
          label: "Update",
          onClick: () => updateServiceWorker(true),
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
