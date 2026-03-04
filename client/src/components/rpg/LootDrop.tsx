import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Gift } from "lucide-react";

const rarityColors: Record<string, string> = {
  common: "bg-gray-500/10 text-gray-600 border-gray-300",
  uncommon: "bg-green-500/10 text-green-600 border-green-300",
  rare: "bg-blue-500/10 text-blue-600 border-blue-300",
  epic: "bg-purple-500/10 text-purple-600 border-purple-300",
  legendary: "bg-yellow-500/10 text-yellow-600 border-yellow-300",
};

export function LootInventory() {
  const lootQuery = trpc.character.getLoot.useQuery();

  if (lootQuery.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const loot = lootQuery.data ?? [];

  if (loot.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Defeat bosses to earn loot</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loot.map(item => (
        <Card
          key={item.id}
          className={`border ${rarityColors[item.rarity]?.split(" ")[2] ?? ""}`}
        >
          <CardContent className="py-2.5 px-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {item.type.replace("_", " ")}
              </p>
            </div>
            <Badge
              variant="outline"
              className={rarityColors[item.rarity] ?? ""}
            >
              {item.rarity}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
