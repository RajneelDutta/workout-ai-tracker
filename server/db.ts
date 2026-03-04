import { eq, and, desc, gte, lte, like, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  exercises,
  workouts,
  sets,
  goals,
  personalRecords,
  aiInsights,
  activeWorkouts,
  activeSets,
  workoutTemplates,
  templateExercises,
  programs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Exercise queries
export async function getExercisesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercises).where(eq(exercises.userId, userId));
}

export async function getExerciseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createExercise(data: typeof exercises.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exercises).values(data);
  return result;
}

// Workout queries
export async function getWorkoutsByUser(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.date))
    .limit(limit)
    .offset(offset);
}

export async function getWorkoutById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWorkout(data: typeof workouts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workouts).values(data);
  return result;
}

export async function updateWorkout(id: number, data: Partial<typeof workouts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(workouts).set(data).where(eq(workouts.id, id));
}

export async function deleteWorkout(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(workouts).where(eq(workouts.id, id));
}

// Sets queries
export async function getSetsByWorkout(workoutId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sets).where(eq(sets.workoutId, workoutId)).orderBy(sets.order);
}

export async function createSet(data: typeof sets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(sets).values(data);
}

export async function updateSet(id: number, data: Partial<typeof sets.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(sets).set(data).where(eq(sets.id, id));
}

export async function deleteSet(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(sets).where(eq(sets.id, id));
}

// Goals queries
export async function getGoalsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
}

export async function createGoal(data: typeof goals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(goals).values(data);
}

export async function updateGoal(id: number, data: Partial<typeof goals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(goals).set(data).where(eq(goals.id, id));
}

// Personal Records queries
export async function getPersonalRecordsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(personalRecords).where(eq(personalRecords.userId, userId)).orderBy(desc(personalRecords.achievedAt));
}

export async function getPersonalRecordByExercise(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(personalRecords)
    .where(and(eq(personalRecords.userId, userId), eq(personalRecords.exerciseId, exerciseId)))
    .orderBy(desc(personalRecords.value))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPersonalRecord(data: typeof personalRecords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(personalRecords).values(data);
}

// AI Insights queries
export async function getAIInsightsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(limit);
}

export async function createAIInsight(data: typeof aiInsights.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(aiInsights).values(data);
}

// Analytics queries
export async function getWorkoutStats(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, startDate),
        lte(workouts.date, endDate)
      )
    );
  
  return result;
}

export async function getExerciseHistory(
  userId: number,
  exerciseId: number,
  limit = 50,
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(sets)
    .where(eq(sets.exerciseId, exerciseId))
    .orderBy(desc(sets.createdAt))
    .limit(limit);

  return result;
}

// Active Workout queries
export async function getActiveWorkout(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(activeWorkouts)
    .where(
      and(
        eq(activeWorkouts.userId, userId),
        eq(activeWorkouts.status, "active"),
      ),
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createActiveWorkout(
  data: typeof activeWorkouts.$inferInsert,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(activeWorkouts).values(data);
  return result;
}

export async function updateActiveWorkout(
  id: number,
  data: Partial<typeof activeWorkouts.$inferInsert>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(activeWorkouts)
    .set(data)
    .where(eq(activeWorkouts.id, id));
}

export async function getActiveSets(activeWorkoutId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(activeSets)
    .where(eq(activeSets.activeWorkoutId, activeWorkoutId))
    .orderBy(activeSets.completedAt);
}

export async function createActiveSet(
  data: typeof activeSets.$inferInsert,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(activeSets).values(data);
}

export async function deleteActiveSet(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(activeSets).where(eq(activeSets.id, id));
}

export async function deleteActiveSetsForWorkout(activeWorkoutId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .delete(activeSets)
    .where(eq(activeSets.activeWorkoutId, activeWorkoutId));
}

export async function deleteActiveWorkout(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .delete(activeWorkouts)
    .where(eq(activeWorkouts.id, id));
}

export async function getLastSetsForExercise(
  userId: number,
  exerciseId: number,
) {
  const db = await getDb();
  if (!db) return [];
  // Get sets from most recent completed workout containing this exercise
  const recentWorkout = await db
    .select({ id: workouts.id })
    .from(workouts)
    .innerJoin(sets, eq(sets.workoutId, workouts.id))
    .where(
      and(eq(workouts.userId, userId), eq(sets.exerciseId, exerciseId)),
    )
    .orderBy(desc(workouts.date))
    .limit(1);

  if (recentWorkout.length === 0) return [];

  return await db
    .select()
    .from(sets)
    .where(
      and(
        eq(sets.workoutId, recentWorkout[0].id),
        eq(sets.exerciseId, exerciseId),
      ),
    )
    .orderBy(sets.order);
}

// Template queries
export async function getTemplatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.userId, userId))
    .orderBy(desc(workoutTemplates.updatedAt));
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTemplateExercises(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(templateExercises)
    .where(eq(templateExercises.templateId, templateId))
    .orderBy(templateExercises.order);
}

export async function createTemplate(
  data: typeof workoutTemplates.$inferInsert,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(workoutTemplates).values(data);
}

export async function updateTemplate(
  id: number,
  data: Partial<typeof workoutTemplates.$inferInsert>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(workoutTemplates)
    .set(data)
    .where(eq(workoutTemplates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(templateExercises)
    .where(eq(templateExercises.templateId, id));
  return await db
    .delete(workoutTemplates)
    .where(eq(workoutTemplates.id, id));
}

export async function setTemplateExercises(
  templateId: number,
  exerciseList: Array<typeof templateExercises.$inferInsert>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing
  await db
    .delete(templateExercises)
    .where(eq(templateExercises.templateId, templateId));
  // Insert new
  if (exerciseList.length > 0) {
    await db.insert(templateExercises).values(exerciseList);
  }
}

// Program queries
export async function getProgramsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(programs)
    .where(eq(programs.userId, userId))
    .orderBy(desc(programs.updatedAt));
}

export async function getActiveProgram(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(programs)
    .where(and(eq(programs.userId, userId), eq(programs.isActive, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProgram(
  data: typeof programs.$inferInsert,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(programs).values(data);
}

export async function updateProgram(
  id: number,
  data: Partial<typeof programs.$inferInsert>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(programs)
    .set(data)
    .where(eq(programs.id, id));
}

export async function deleteProgram(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(programs).where(eq(programs.id, id));
}
