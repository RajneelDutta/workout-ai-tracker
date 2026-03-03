// =============================================================================
// Gamification Engine — XP, Levels, Streaks, Badges
// =============================================================================

export type Level = {
  level: number; title: string; emoji: string;
  minXP: number; maxXP: number; color: string;
};

export const LEVELS: Level[] = [
  { level: 1,  title: "Rookie",    emoji: "🌱", minXP: 0,     maxXP: 199,    color: "#94a3b8" },
  { level: 2,  title: "Grinder",   emoji: "💪", minXP: 200,   maxXP: 499,    color: "#22c55e" },
  { level: 3,  title: "Iron",      emoji: "🔩", minXP: 500,   maxXP: 999,    color: "#3b82f6" },
  { level: 4,  title: "Bronze",    emoji: "🥉", minXP: 1000,  maxXP: 1999,   color: "#cd7f32" },
  { level: 5,  title: "Silver",    emoji: "🥈", minXP: 2000,  maxXP: 3499,   color: "#c0c0c0" },
  { level: 6,  title: "Gold",      emoji: "🥇", minXP: 3500,  maxXP: 5999,   color: "#eab308" },
  { level: 7,  title: "Platinum",  emoji: "💎", minXP: 6000,  maxXP: 9999,   color: "#67e8f9" },
  { level: 8,  title: "Diamond",   emoji: "💠", minXP: 10000, maxXP: 14999,  color: "#818cf8" },
  { level: 9,  title: "Elite",     emoji: "🔥", minXP: 15000, maxXP: 24999,  color: "#f97316" },
  { level: 10, title: "Legend",    emoji: "👑", minXP: 25000, maxXP: Infinity,color: "#fbbf24" },
];

export type Badge = {
  id: string; title: string; description: string;
  emoji: string; unlocked: boolean; unlockedAt?: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
};

export type WeeklyChallenge = {
  title: string; description: string; emoji: string;
  progress: number; target: number; completed: boolean; xpReward: number;
};

export type XPGain = {
  amount: number; reason: string; emoji: string; timestamp: Date;
};

export type GamificationState = {
  xp: number; level: Level; nextLevel: Level | null;
  xpToNextLevel: number; xpProgressPercent: number;
  streak: number; longestStreak: number;
  badges: Badge[]; weeklyChallenge: WeeklyChallenge;
  recentXPGains: XPGain[];
};

export type WorkoutSummary = { id: number; date: Date; totalVolume?: number | null; };
export type PRSummary = { achievedAt: Date; };
export type GoalSummary = { status: "active"|"completed"|"abandoned"; completedAt?: Date|null; };

export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function calculateTotalXP(workouts: WorkoutSummary[], prs: PRSummary[], goals: GoalSummary[]) {
  const gains: XPGain[] = [];
  workouts.forEach((w) => {
    gains.push({ amount: 50, reason: "Workout logged", emoji: "🏋️", timestamp: w.date });
    if (w.totalVolume && w.totalVolume >= 10000)
      gains.push({ amount: 25, reason: "10,000+ lbs volume!", emoji: "📈", timestamp: w.date });
  });
  prs.forEach((pr) => gains.push({ amount: 100, reason: "Personal Record!", emoji: "🏆", timestamp: pr.achievedAt }));
  goals.filter(g => g.status === "completed" && g.completedAt)
    .forEach((g) => gains.push({ amount: 200, reason: "Goal completed!", emoji: "🎯", timestamp: g.completedAt! }));
  return { total: gains.reduce((s, g) => s + g.amount, 0), gains: gains.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()) };
}

export function calculateStreak(workouts: WorkoutSummary[]) {
  if (!workouts.length) return { current: 0, longest: 0 };
  const days = Array.from(new Set(workouts.map(w => new Date(w.date).toDateString())))
    .map(d => new Date(d)).sort((a,b) => b.getTime() - a.getTime());
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const last = new Date(days[0]); last.setHours(0,0,0,0);
  let current = 0;
  if (last.getTime() === today.getTime() || last.getTime() === yesterday.getTime()) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      const a = new Date(days[i-1]); a.setHours(0,0,0,0);
      const b = new Date(days[i]);   b.setHours(0,0,0,0);
      if ((a.getTime() - b.getTime()) / 86400000 === 1) current++; else break;
    }
  }
  let streak = 1, longest = current;
  for (let i = 1; i < days.length; i++) {
    const a = new Date(days[i-1]); a.setHours(0,0,0,0);
    const b = new Date(days[i]);   b.setHours(0,0,0,0);
    if ((a.getTime() - b.getTime()) / 86400000 === 1) { streak++; longest = Math.max(longest, streak); }
    else streak = 1;
  }
  return { current, longest };
}

const BADGE_DEFS = [
  { id: "first_workout",    title: "First Step",       description: "Log your first workout",               emoji: "👟", rarity: "common"    as const },
  { id: "ten_workouts",     title: "Getting Consistent",description: "Log 10 workouts",                     emoji: "📅", rarity: "common"    as const },
  { id: "fifty_workouts",   title: "Dedicated",        description: "Log 50 workouts",                      emoji: "💪", rarity: "rare"      as const },
  { id: "hundred_workouts", title: "Century Club",     description: "Log 100 workouts",                     emoji: "💯", rarity: "epic"      as const },
  { id: "first_pr",         title: "PR Crusher",       description: "Hit your first personal record",       emoji: "🏆", rarity: "common"    as const },
  { id: "five_prs",         title: "Record Breaker",   description: "Hit 5 personal records",               emoji: "⚡", rarity: "rare"      as const },
  { id: "streak_7",         title: "Week Warrior",     description: "7-day workout streak",                 emoji: "🗓️", rarity: "rare"      as const },
  { id: "streak_30",        title: "Iron Will",        description: "30-day workout streak",                emoji: "🦾", rarity: "epic"      as const },
  { id: "streak_100",       title: "Unstoppable",      description: "100-day workout streak",               emoji: "👑", rarity: "legendary" as const },
  { id: "first_goal",       title: "Goal Getter",      description: "Complete your first goal",             emoji: "🎯", rarity: "common"    as const },
  { id: "comeback",         title: "Comeback Kid",     description: "Return after a 2-week break",          emoji: "🔄", rarity: "rare"      as const },
  { id: "heavy_lifter",     title: "Heavy Lifter",     description: "Log 10,000+ lbs in one session",       emoji: "🏋️", rarity: "epic"      as const },
];

export function calculateBadges(workouts: WorkoutSummary[], prs: PRSummary[], goals: GoalSummary[], streak: number): Badge[] {
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const maxVolume = Math.max(...workouts.map(w => w.totalVolume ?? 0), 0);
  const sorted = [...workouts].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let hasComeback = false;
  for (let i = 1; i < sorted.length; i++) {
    if ((new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) / 86400000 > 14) { hasComeback = true; break; }
  }
  const unlockMap: Record<string, boolean> = {
    first_workout: workouts.length >= 1,    ten_workouts: workouts.length >= 10,
    fifty_workouts: workouts.length >= 50,  hundred_workouts: workouts.length >= 100,
    first_pr: prs.length >= 1,              five_prs: prs.length >= 5,
    streak_7: streak >= 7,                  streak_30: streak >= 30,
    streak_100: streak >= 100,              first_goal: completedGoals >= 1,
    comeback: hasComeback,                  heavy_lifter: maxVolume >= 10000,
  };
  return BADGE_DEFS.map(b => ({ ...b, unlocked: unlockMap[b.id] ?? false }));
}

export function generateWeeklyChallenge(workouts: WorkoutSummary[], prs: PRSummary[]): WeeklyChallenge {
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const workoutsThisWeek = workouts.filter(w => new Date(w.date) >= weekStart).length;
  const prsThisWeek = prs.filter(p => new Date(p.achievedAt) >= weekStart).length;
  const week = Math.floor(now.getTime() / (7*24*60*60*1000));
  const options = [
    { title: "Consistency Week",  description: "Log 4 workouts this week",        emoji: "🗓️", target: 4, progress: workoutsThisWeek, xpReward: 300 },
    { title: "PR Hunter",         description: "Hit 2 personal records this week", emoji: "🎯", target: 2, progress: prsThisWeek,      xpReward: 400 },
    { title: "Grind Week",        description: "Log 5 workouts this week",         emoji: "💪", target: 5, progress: workoutsThisWeek, xpReward: 500 },
    { title: "3-Day Push",        description: "Log 3 workouts this week",         emoji: "📈", target: 3, progress: workoutsThisWeek, xpReward: 250 },
  ];
  const c = options[week % options.length];
  return { ...c, completed: c.progress >= c.target };
}

export function computeGamificationState(workouts: WorkoutSummary[], prs: PRSummary[], goals: GoalSummary[]): GamificationState {
  const { total: xp, gains } = calculateTotalXP(workouts, prs, goals);
  const level = getLevelForXP(xp);
  const nextLevel = LEVELS.find(l => l.level === level.level + 1) ?? null;
  const xpToNextLevel = nextLevel ? nextLevel.minXP - xp : 0;
  const xpRange = nextLevel ? nextLevel.minXP - level.minXP : 1;
  const xpProgressPercent = nextLevel ? Math.min(100, Math.round(((xp - level.minXP) / xpRange) * 100)) : 100;
  const { current: streak, longest: longestStreak } = calculateStreak(workouts);
  const badges = calculateBadges(workouts, prs, goals, streak);
  const weeklyChallenge = generateWeeklyChallenge(workouts, prs);
  return { xp, level, nextLevel, xpToNextLevel, xpProgressPercent, streak, longestStreak, badges, weeklyChallenge, recentXPGains: gains.slice(0,5) };
}