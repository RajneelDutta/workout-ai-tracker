import { eq, and, desc, gte } from "drizzle-orm";
import { getDb } from "./db";
import {
  characterProfiles,
  xpTransactions,
  unlockedBadges,
  skillNodes,
  bossFights,
  lootRewards,
  workouts,
  sets,
  personalRecords,
  goals,
  exercises,
} from "../drizzle/schema";

// ============ Constants ============

const MAX_LEVEL = 50;
const PRESTIGE_LEVEL = 50;

/** XP threshold for level n = 100 * n^1.5 */
function xpForLevel(n: number): number {
  if (n <= 1) return 0;
  return Math.floor(100 * Math.pow(n, 1.5));
}

/** Cumulative XP needed to reach level n */
function cumulativeXpForLevel(n: number): number {
  let total = 0;
  for (let i = 2; i <= n; i++) total += xpForLevel(i);
  return total;
}

function levelFromXp(totalXp: number): number {
  let level = 1;
  let cumulative = 0;
  for (let i = 2; i <= MAX_LEVEL; i++) {
    cumulative += xpForLevel(i);
    if (totalXp >= cumulative) level = i;
    else break;
  }
  return level;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Rookie",
  5: "Warrior",
  10: "Iron",
  15: "Bronze",
  20: "Silver",
  25: "Gold",
  30: "Platinum",
  35: "Diamond",
  40: "Elite",
  45: "Champion",
  50: "Legend",
};

function titleForLevel(level: number): string {
  let title = "Rookie";
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= Number(lvl)) title = t;
  }
  return title;
}

// Stat routing: exercise category → stat type
function statForCategory(category: string): "STR" | "END" | "AGI" | "FLX" {
  switch (category) {
    case "strength":
      return "STR";
    case "cardio":
      return "END";
    case "sports":
      return "AGI";
    case "flexibility":
      return "FLX";
    default:
      return "STR";
  }
}

// Skill tier thresholds
const SKILL_TIERS = [
  { tier: "novice" as const, threshold: 0 },
  { tier: "intermediate" as const, threshold: 500 },
  { tier: "advanced" as const, threshold: 2000 },
  { tier: "master" as const, threshold: 5000 },
];

function tierFromXp(xp: number) {
  let tier = SKILL_TIERS[0].tier;
  for (const t of SKILL_TIERS) {
    if (xp >= t.threshold) tier = t.tier;
  }
  return tier;
}

// ============ Badge Definitions ============

type BadgeDef = {
  id: string;
  title: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (ctx: BadgeCheckContext) => boolean;
};

type BadgeCheckContext = {
  totalWorkouts: number;
  totalPRs: number;
  completedGoals: number;
  currentStreak: number;
  longestStreak: number;
  maxVolume: number;
  totalXp: number;
  level: number;
};

const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first_workout",
    title: "First Step",
    description: "Complete your first workout",
    rarity: "common",
    check: c => c.totalWorkouts >= 1,
  },
  {
    id: "ten_workouts",
    title: "Getting Consistent",
    description: "Complete 10 workouts",
    rarity: "common",
    check: c => c.totalWorkouts >= 10,
  },
  {
    id: "fifty_workouts",
    title: "Dedicated",
    description: "Complete 50 workouts",
    rarity: "rare",
    check: c => c.totalWorkouts >= 50,
  },
  {
    id: "hundred_workouts",
    title: "Century Club",
    description: "Complete 100 workouts",
    rarity: "epic",
    check: c => c.totalWorkouts >= 100,
  },
  {
    id: "first_pr",
    title: "PR Crusher",
    description: "Hit your first personal record",
    rarity: "common",
    check: c => c.totalPRs >= 1,
  },
  {
    id: "five_prs",
    title: "Record Breaker",
    description: "Hit 5 personal records",
    rarity: "rare",
    check: c => c.totalPRs >= 5,
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "7-day workout streak",
    rarity: "rare",
    check: c => c.longestStreak >= 7,
  },
  {
    id: "streak_30",
    title: "Iron Will",
    description: "30-day workout streak",
    rarity: "epic",
    check: c => c.longestStreak >= 30,
  },
  {
    id: "streak_100",
    title: "Unstoppable",
    description: "100-day workout streak",
    rarity: "legendary",
    check: c => c.longestStreak >= 100,
  },
  {
    id: "first_goal",
    title: "Goal Getter",
    description: "Complete your first goal",
    rarity: "common",
    check: c => c.completedGoals >= 1,
  },
  {
    id: "heavy_lifter",
    title: "Heavy Lifter",
    description: "10,000+ lbs in one session",
    rarity: "epic",
    check: c => c.maxVolume >= 10000,
  },
  {
    id: "level_10",
    title: "Double Digits",
    description: "Reach level 10",
    rarity: "rare",
    check: c => c.level >= 10,
  },
  {
    id: "level_25",
    title: "Halfway Hero",
    description: "Reach level 25",
    rarity: "epic",
    check: c => c.level >= 25,
  },
  {
    id: "level_50",
    title: "Max Level",
    description: "Reach level 50",
    rarity: "legendary",
    check: c => c.level >= 50,
  },
];

// ============ Core Functions ============

export async function getOrCreateProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(characterProfiles)
    .where(eq(characterProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(characterProfiles).values({ userId });
  const created = await db
    .select()
    .from(characterProfiles)
    .where(eq(characterProfiles.userId, userId))
    .limit(1);
  return created[0];
}

/**
 * Award XP for a workout and update character profile.
 * Called after completing a workout.
 */
export async function processWorkoutXP(
  userId: number,
  workoutData: {
    totalVolume: number;
    totalSets: number;
    newPRCount: number;
    exerciseCategories: string[];
    currentStreak: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const profile = await getOrCreateProfile(userId);
  const txns: Array<{
    amount: number;
    reason: string;
    source: string;
    statType: "STR" | "END" | "AGI" | "FLX" | null;
    multiplier: number;
  }> = [];

  // Streak multiplier: 1.1x per day, max 2x
  const streakMult = Math.min(2.0, 1.0 + workoutData.currentStreak * 0.1);

  // Base XP for workout
  txns.push({
    amount: Math.round(50 * streakMult),
    reason: "Workout completed",
    source: "workout",
    statType: null,
    multiplier: streakMult,
  });

  // Volume bonus
  if (workoutData.totalVolume >= 10000) {
    txns.push({
      amount: Math.round(25 * streakMult),
      reason: "10K+ volume bonus",
      source: "workout",
      statType: "STR",
      multiplier: streakMult,
    });
  }

  // PR bonus (100 XP per PR)
  for (let i = 0; i < workoutData.newPRCount; i++) {
    txns.push({
      amount: Math.round(100 * streakMult),
      reason: "Personal Record!",
      source: "pr",
      statType: "STR",
      multiplier: streakMult,
    });
  }

  // Per-set XP for each exercise category
  const catCounts = new Map<string, number>();
  for (const cat of workoutData.exerciseCategories) {
    catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
  }
  for (const [cat, count] of Array.from(catCounts)) {
    const stat = statForCategory(cat);
    txns.push({
      amount: Math.round(count * 10 * streakMult),
      reason: `${count} ${cat} sets`,
      source: "workout",
      statType: stat,
      multiplier: streakMult,
    });
  }

  // Insert XP transactions
  let totalXpGained = 0;
  for (const txn of txns) {
    totalXpGained += txn.amount;
    await db.insert(xpTransactions).values({
      userId,
      amount: txn.amount,
      reason: txn.reason,
      source: txn.source,
      multiplier: txn.multiplier.toString(),
      statType: txn.statType,
    });
  }

  // Update profile
  const newTotalXp = profile.totalXp + totalXpGained;
  const newLevel = levelFromXp(newTotalXp);
  const leveledUp = newLevel > profile.level;

  // Update stat points
  const statDeltas = { STR: 0, END: 0, AGI: 0, FLX: 0 };
  for (const txn of txns) {
    if (txn.statType) statDeltas[txn.statType] += txn.amount;
  }

  await db
    .update(characterProfiles)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      title: titleForLevel(newLevel),
      statSTR: profile.statSTR + statDeltas.STR,
      statEND: profile.statEND + statDeltas.END,
      statAGI: profile.statAGI + statDeltas.AGI,
      statFLX: profile.statFLX + statDeltas.FLX,
    })
    .where(eq(characterProfiles.id, profile.id));

  // Update skill nodes for muscle groups
  await updateSkillNodes(userId, workoutData.exerciseCategories);

  // Check badges
  const newBadges = await checkAndAwardBadges(userId);

  // Update boss fights
  const bossUpdates = await updateBossFights(userId, workoutData);

  return {
    xpGained: totalXpGained,
    newTotalXp,
    newLevel,
    newTitle: titleForLevel(newLevel),
    leveledUp,
    previousLevel: profile.level,
    newBadges,
    bossUpdates,
    transactions: txns.map(t => ({
      amount: t.amount,
      reason: t.reason,
    })),
  };
}

async function updateSkillNodes(userId: number, exerciseCategories: string[]) {
  const db = await getDb();
  if (!db) return;

  // Count XP per muscle group from categories
  const groupXp = new Map<string, number>();
  for (const cat of exerciseCategories) {
    const group = cat; // Use category as muscle group for simplicity
    groupXp.set(group, (groupXp.get(group) ?? 0) + 10);
  }

  for (const [group, xpGain] of Array.from(groupXp)) {
    const existing = await db
      .select()
      .from(skillNodes)
      .where(
        and(eq(skillNodes.userId, userId), eq(skillNodes.muscleGroup, group))
      )
      .limit(1);

    if (existing.length > 0) {
      const newXp = existing[0].xp + xpGain;
      await db
        .update(skillNodes)
        .set({
          xp: newXp,
          tier: tierFromXp(newXp),
        })
        .where(eq(skillNodes.id, existing[0].id));
    } else {
      await db.insert(skillNodes).values({
        userId,
        muscleGroup: group,
        xp: xpGain,
        tier: tierFromXp(xpGain),
      });
    }
  }
}

async function checkAndAwardBadges(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  // Get already unlocked
  const existing = await db
    .select()
    .from(unlockedBadges)
    .where(eq(unlockedBadges.userId, userId));
  const unlockedIds = new Set(existing.map(b => b.badgeId));

  // Get stats for badge checks
  const profile = await getOrCreateProfile(userId);
  const allWorkouts = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
  const allPRs = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId));
  const allGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  // Calculate streak
  const streak = calculateStreak(allWorkouts.map(w => new Date(w.date)));

  // Max volume
  const maxVolume = Math.max(
    ...allWorkouts.map(w => Number(w.totalVolume ?? 0)),
    0
  );

  const ctx: BadgeCheckContext = {
    totalWorkouts: allWorkouts.length,
    totalPRs: allPRs.length,
    completedGoals: allGoals.filter(g => g.status === "completed").length,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    maxVolume,
    totalXp: profile.totalXp,
    level: profile.level,
  };

  const newBadges: string[] = [];
  for (const badge of BADGE_DEFS) {
    if (!unlockedIds.has(badge.id) && badge.check(ctx)) {
      await db.insert(unlockedBadges).values({
        userId,
        badgeId: badge.id,
      });
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

async function updateBossFights(
  userId: number,
  workoutData: {
    totalVolume: number;
    totalSets: number;
    newPRCount: number;
  }
): Promise<Array<{ id: number; defeated: boolean; name: string }>> {
  const db = await getDb();
  if (!db) return [];

  const activeBosses = await db
    .select()
    .from(bossFights)
    .where(and(eq(bossFights.userId, userId), eq(bossFights.status, "active")));

  const updates: Array<{ id: number; defeated: boolean; name: string }> = [];

  for (const boss of activeBosses) {
    // Check if expired
    if (new Date(boss.expiresAt) < new Date()) {
      await db
        .update(bossFights)
        .set({ status: "expired" })
        .where(eq(bossFights.id, boss.id));
      continue;
    }

    let increment = 0;
    switch (boss.type) {
      case "volume":
        increment = workoutData.totalVolume;
        break;
      case "strength":
        increment = workoutData.newPRCount;
        break;
      case "endurance":
        increment = workoutData.totalSets;
        break;
      case "consistency":
        increment = 1; // 1 workout
        break;
    }

    const newValue = boss.currentValue + increment;
    const defeated = newValue >= boss.targetValue;

    await db
      .update(bossFights)
      .set({
        currentValue: newValue,
        status: defeated ? "defeated" : "active",
      })
      .where(eq(bossFights.id, boss.id));

    if (defeated) {
      // Award boss XP
      await db.insert(xpTransactions).values({
        userId,
        amount: boss.xpReward,
        reason: `Defeated ${boss.name}!`,
        source: "boss",
        multiplier: "1.00",
      });

      // Update profile XP
      const profile = await getOrCreateProfile(userId);
      const newXp = profile.totalXp + boss.xpReward;
      await db
        .update(characterProfiles)
        .set({
          totalXp: newXp,
          level: levelFromXp(newXp),
          title: titleForLevel(levelFromXp(newXp)),
        })
        .where(eq(characterProfiles.id, profile.id));

      // Award loot for boss defeat
      await db.insert(lootRewards).values({
        userId,
        type: "title",
        name: `${boss.name} Slayer`,
        rarity: boss.xpReward >= 500 ? "epic" : "rare",
      });
    }

    updates.push({ id: boss.id, defeated, name: boss.name });
  }

  return updates;
}

/** Generate a new boss fight for the user */
export async function generateBossFight(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const bossTemplates = [
    {
      name: "Iron Golem",
      type: "volume" as const,
      description: "Crush 50,000 lbs of total volume",
      targetValue: 50000,
      xpReward: 500,
    },
    {
      name: "The PR Dragon",
      type: "strength" as const,
      description: "Hit 3 personal records",
      targetValue: 3,
      xpReward: 400,
    },
    {
      name: "Endurance Hydra",
      type: "endurance" as const,
      description: "Complete 50 total sets",
      targetValue: 50,
      xpReward: 350,
    },
    {
      name: "Consistency Phantom",
      type: "consistency" as const,
      description: "Work out 5 times",
      targetValue: 5,
      xpReward: 300,
    },
    {
      name: "Volume Titan",
      type: "volume" as const,
      description: "Crush 100,000 lbs of total volume",
      targetValue: 100000,
      xpReward: 750,
    },
    {
      name: "The Streak Demon",
      type: "consistency" as const,
      description: "Work out 7 times",
      targetValue: 7,
      xpReward: 500,
    },
  ];

  const template =
    bossTemplates[Math.floor(Math.random() * bossTemplates.length)];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // 2-week deadline

  await db.insert(bossFights).values({
    userId,
    name: template.name,
    type: template.type,
    description: template.description,
    targetValue: template.targetValue,
    xpReward: template.xpReward,
    expiresAt,
  });
}

/**
 * Migrate historical data: backfill XP from all past workouts.
 * Idempotent — skips if profile already has XP.
 */
export async function migrateHistoricalData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const profile = await getOrCreateProfile(userId);
  if (profile.totalXp > 0) return { alreadyMigrated: true };

  // Get all workouts with their sets
  const allWorkouts = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(workouts.date);

  const allPRs = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId));

  const allGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  let totalXp = 0;
  const statTotals = { STR: 0, END: 0, AGI: 0, FLX: 0 };

  // XP per workout
  for (const w of allWorkouts) {
    totalXp += 50;
    if (w.totalVolume && Number(w.totalVolume) >= 10000) {
      totalXp += 25;
      statTotals.STR += 25;
    }

    // Get workout sets for stat routing
    const workoutSets = await db
      .select({ exerciseId: sets.exerciseId })
      .from(sets)
      .where(eq(sets.workoutId, w.id));

    for (const s of workoutSets) {
      const exercise = await db
        .select({ category: exercises.category })
        .from(exercises)
        .where(eq(exercises.id, s.exerciseId))
        .limit(1);
      if (exercise.length > 0) {
        const stat = statForCategory(exercise[0].category);
        statTotals[stat] += 10;
        totalXp += 10;
      }
    }
  }

  // XP per PR
  totalXp += allPRs.length * 100;
  statTotals.STR += allPRs.length * 100;

  // XP per completed goal
  const completedGoals = allGoals.filter(g => g.status === "completed");
  totalXp += completedGoals.length * 200;

  const level = levelFromXp(totalXp);

  await db
    .update(characterProfiles)
    .set({
      totalXp,
      level,
      title: titleForLevel(level),
      statSTR: statTotals.STR,
      statEND: statTotals.END,
      statAGI: statTotals.AGI,
      statFLX: statTotals.FLX,
    })
    .where(eq(characterProfiles.id, profile.id));

  // Record a single migration transaction
  await db.insert(xpTransactions).values({
    userId,
    amount: totalXp,
    reason: "Historical data migration",
    source: "migration",
    multiplier: "1.00",
  });

  // Check all badges
  await checkAndAwardBadges(userId);

  // Generate first boss fight
  await generateBossFight(userId);

  return { migrated: true, totalXp, level };
}

// ============ Helper: Streak Calculator ============

function calculateStreak(dates: Date[]) {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const days = Array.from(new Set(dates.map(d => new Date(d).toDateString())))
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last = new Date(days[0]);
  last.setHours(0, 0, 0, 0);

  let current = 0;
  if (
    last.getTime() === today.getTime() ||
    last.getTime() === yesterday.getTime()
  ) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      const a = new Date(days[i - 1]);
      a.setHours(0, 0, 0, 0);
      const b = new Date(days[i]);
      b.setHours(0, 0, 0, 0);
      if ((a.getTime() - b.getTime()) / 86400000 === 1) current++;
      else break;
    }
  }

  let streak = 1,
    longest = current;
  for (let i = 1; i < days.length; i++) {
    const a = new Date(days[i - 1]);
    a.setHours(0, 0, 0, 0);
    const b = new Date(days[i]);
    b.setHours(0, 0, 0, 0);
    if ((a.getTime() - b.getTime()) / 86400000 === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  return { current, longest };
}

export async function getStreak(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const allWorkouts = await db
    .select({ date: workouts.date })
    .from(workouts)
    .where(eq(workouts.userId, userId));
  return calculateStreak(allWorkouts.map(w => new Date(w.date))).current;
}

// ============ Query helpers for tRPC ============

export async function getXPHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, userId))
    .orderBy(desc(xpTransactions.createdAt))
    .limit(limit);
}

export async function getBadges(userId: number) {
  const db = await getDb();
  if (!db) return { unlocked: [], definitions: BADGE_DEFS };
  const unlocked = await db
    .select()
    .from(unlockedBadges)
    .where(eq(unlockedBadges.userId, userId));
  return {
    unlocked: unlocked.map(b => ({
      badgeId: b.badgeId,
      unlockedAt: b.unlockedAt,
    })),
    definitions: BADGE_DEFS.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      rarity: b.rarity,
    })),
  };
}

export async function getSkillTree(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(skillNodes)
    .where(eq(skillNodes.userId, userId));
}

export async function getActiveBossFights(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(bossFights)
    .where(and(eq(bossFights.userId, userId), eq(bossFights.status, "active")));
}

export async function getAllBossFights(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(bossFights)
    .where(eq(bossFights.userId, userId))
    .orderBy(desc(bossFights.createdAt));
}

export async function getLoot(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(lootRewards)
    .where(eq(lootRewards.userId, userId))
    .orderBy(desc(lootRewards.earnedAt));
}

export {
  BADGE_DEFS,
  xpForLevel,
  cumulativeXpForLevel,
  levelFromXp,
  titleForLevel,
};
