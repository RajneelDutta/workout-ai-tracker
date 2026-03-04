import DashboardLayout from "@/components/DashboardLayout";
import { CharacterCard } from "@/components/rpg/CharacterCard";
import { StatRadar } from "@/components/rpg/StatRadar";
import { SkillTree } from "@/components/rpg/SkillTree";
import { BossFight } from "@/components/rpg/BossFight";
import { LootInventory } from "@/components/rpg/LootDrop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, ScrollText } from "lucide-react";

const badgeEmoji: Record<string, string> = {
  first_workout: "👟",
  ten_workouts: "📅",
  fifty_workouts: "💪",
  hundred_workouts: "💯",
  first_pr: "🏆",
  five_prs: "⚡",
  streak_7: "🗓️",
  streak_30: "🦾",
  streak_100: "👑",
  first_goal: "🎯",
  heavy_lifter: "🏋️",
  level_10: "🔟",
  level_25: "⭐",
  level_50: "🌟",
};

const rarityBorder: Record<string, string> = {
  common: "border-gray-300",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400",
};

export default function CharacterPage() {
  const profileQuery = trpc.character.getProfile.useQuery();
  const badgesQuery = trpc.character.getBadges.useQuery();
  const xpQuery = trpc.character.getXPHistory.useQuery({ limit: 20 });
  const profile = profileQuery.data;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Character</h1>

        <CharacterCard />

        {profile && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Stat Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <StatRadar
                STR={profile.statSTR}
                END={profile.statEND}
                AGI={profile.statAGI}
                FLX={profile.statFLX}
              />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="skills">
          <TabsList className="w-full">
            <TabsTrigger value="skills" className="flex-1">
              Skills
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex-1">
              Badges
            </TabsTrigger>
            <TabsTrigger value="bosses" className="flex-1">
              Bosses
            </TabsTrigger>
            <TabsTrigger value="loot" className="flex-1">
              Loot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="mt-4">
            <SkillTree />
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            {badgesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badgesQuery.data?.definitions.map(badge => {
                  const unlocked = badgesQuery.data?.unlocked.some(
                    u => u.badgeId === badge.id
                  );
                  return (
                    <Card
                      key={badge.id}
                      className={`${
                        unlocked
                          ? `border-2 ${rarityBorder[badge.rarity] ?? ""}`
                          : "opacity-40"
                      }`}
                    >
                      <CardContent className="py-3 px-3 text-center">
                        <span className="text-2xl">
                          {badgeEmoji[badge.id] ?? "🏅"}
                        </span>
                        <p className="font-semibold text-sm mt-1">
                          {badge.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {badge.description}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {badge.rarity}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bosses" className="mt-4">
            <BossFight />
          </TabsContent>

          <TabsContent value="loot" className="mt-4">
            <LootInventory />
          </TabsContent>
        </Tabs>

        {/* XP History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ScrollText className="h-4 w-4" />
              XP History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {xpQuery.isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (xpQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No XP earned yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(xpQuery.data ?? []).map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span>{tx.reason}</span>
                    <span className="font-bold text-primary">+{tx.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
