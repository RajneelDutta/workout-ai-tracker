import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Minus } from "lucide-react";

type Props = {
  exerciseId: number;
};

export function ProgressionBadge({ exerciseId }: Props) {
  const suggestion = trpc.progression.getSuggestion.useQuery(
    { exerciseId },
    { enabled: exerciseId > 0 }
  );

  if (!suggestion.data || suggestion.data.suggestion === "start") {
    return null;
  }

  const data = suggestion.data;

  if (data.suggestion === "increase") {
    return (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-600 border-green-300 gap-1"
      >
        <TrendingUp className="h-3 w-3" />
        {data.message}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-yellow-500/10 text-yellow-600 border-yellow-300 gap-1"
    >
      <Minus className="h-3 w-3" />
      {data.message}
    </Badge>
  );
}
