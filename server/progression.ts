import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { sets, workouts, exercises } from "../drizzle/schema";

/**
 * Get progressive overload suggestion for an exercise.
 * Looks at last 3 sessions and suggests weight increase if
 * target was hit 2+ times.
 */
export async function getProgressionSuggestion(
  userId: number,
  exerciseId: number,
) {
  const db = await getDb();
  if (!db) return null;

  // Get the exercise to determine category
  const exerciseResult = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);
  if (exerciseResult.length === 0) return null;
  const exercise = exerciseResult[0];

  // Get last 3 workouts containing this exercise
  const recentSets = await db
    .select({
      workoutId: sets.workoutId,
      reps: sets.reps,
      weight: sets.weight,
      workoutDate: workouts.date,
    })
    .from(sets)
    .innerJoin(workouts, eq(sets.workoutId, workouts.id))
    .where(
      and(eq(sets.exerciseId, exerciseId), eq(workouts.userId, userId)),
    )
    .orderBy(desc(workouts.date))
    .limit(30); // Get enough sets to cover 3 workouts

  if (recentSets.length === 0) {
    return { suggestion: "start", message: "No history yet" };
  }

  // Group by workout
  const workoutMap = new Map<
    number,
    Array<{ reps: number; weight: number }>
  >();
  for (const s of recentSets) {
    if (!workoutMap.has(s.workoutId)) {
      workoutMap.set(s.workoutId, []);
    }
    workoutMap.get(s.workoutId)!.push({
      reps: s.reps,
      weight: Number(s.weight ?? 0),
    });
  }

  const lastWorkouts = Array.from(workoutMap.entries()).slice(0, 3);
  if (lastWorkouts.length < 2) {
    return {
      suggestion: "maintain",
      message: "Need more sessions",
      currentWeight: Number(recentSets[0].weight ?? 0),
    };
  }

  // Find the most commonly used weight across last workouts
  const weights = recentSets
    .map(s => Number(s.weight ?? 0))
    .filter(w => w > 0);
  if (weights.length === 0) {
    return { suggestion: "maintain", message: "No weight data" };
  }

  const currentWeight = weights[0]; // Most recent weight
  const targetReps = 8; // Default target

  // Count how many of last 3 sessions hit target reps at current weight
  let sessionsHitTarget = 0;
  for (const [, sessionSets] of lastWorkouts) {
    const atCurrentWeight = sessionSets.filter(
      s => Math.abs(s.weight - currentWeight) < 2.5,
    );
    if (
      atCurrentWeight.length > 0 &&
      atCurrentWeight.every(s => s.reps >= targetReps)
    ) {
      sessionsHitTarget++;
    }
  }

  // Determine weight increment based on exercise type
  const isUpperBody = ["chest", "shoulders", "arms", "back"].some(g =>
    (exercise.muscleGroups as string[]).some(
      mg => mg.toLowerCase().includes(g),
    ),
  );
  const increment = isUpperBody ? 5 : 10;

  if (sessionsHitTarget >= 2) {
    return {
      suggestion: "increase",
      message: `Try ${currentWeight + increment} lbs`,
      currentWeight,
      suggestedWeight: currentWeight + increment,
      increment,
    };
  }

  return {
    suggestion: "maintain",
    message: `Stay at ${currentWeight} lbs`,
    currentWeight,
  };
}

/**
 * Estimate 1RM using Epley formula: weight * (1 + reps/30)
 */
export async function estimate1RM(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return null;

  const recentSets = await db
    .select({
      reps: sets.reps,
      weight: sets.weight,
      date: workouts.date,
    })
    .from(sets)
    .innerJoin(workouts, eq(sets.workoutId, workouts.id))
    .where(
      and(eq(sets.exerciseId, exerciseId), eq(workouts.userId, userId)),
    )
    .orderBy(desc(workouts.date))
    .limit(50);

  if (recentSets.length === 0) return null;

  // Calculate 1RM for each set and find the max
  let max1RM = 0;
  let bestSet = recentSets[0];

  for (const s of recentSets) {
    const w = Number(s.weight ?? 0);
    const r = s.reps;
    if (w <= 0 || r <= 0) continue;

    const estimated = r === 1 ? w : w * (1 + r / 30);
    if (estimated > max1RM) {
      max1RM = estimated;
      bestSet = s;
    }
  }

  // Calculate trend from last 5 distinct 1RM values over time
  const seenDates = new Set<string>();
  const trend: Array<{ date: string; estimated1RM: number }> = [];
  for (const s of recentSets) {
    const dateStr = new Date(s.date).toISOString().split("T")[0];
    if (seenDates.has(dateStr)) continue;
    seenDates.add(dateStr);

    const w = Number(s.weight ?? 0);
    const r = s.reps;
    if (w <= 0 || r <= 0) continue;

    trend.push({
      date: dateStr,
      estimated1RM: Math.round(r === 1 ? w : w * (1 + r / 30)),
    });
    if (trend.length >= 10) break;
  }

  return {
    estimated1RM: Math.round(max1RM),
    bestWeight: Number(bestSet.weight ?? 0),
    bestReps: bestSet.reps,
    trend: trend.reverse(),
  };
}
