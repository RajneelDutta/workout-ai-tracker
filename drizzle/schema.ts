import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Exercise library table - contains predefined and custom exercises
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "strength",
    "cardio",
    "flexibility",
    "sports",
    "other",
  ]).notNull(),
  muscleGroups: json("muscleGroups").$type<string[]>().notNull(),
  isCustom: boolean("isCustom").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * Workouts table - represents a complete workout session
 */
export const workouts = mysqlTable("workouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  duration: int("duration"), // in minutes
  notes: text("notes"),
  totalVolume: decimal("totalVolume", { precision: 10, scale: 2 }), // weight × reps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;

/**
 * Sets table - individual sets within a workout
 */
export const sets = mysqlTable("sets", {
  id: int("id").autoincrement().primaryKey(),
  workoutId: int("workoutId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  reps: int("reps").notNull(),
  weight: decimal("weight", { precision: 8, scale: 2 }), // in kg
  duration: int("duration"), // in seconds for cardio
  distance: decimal("distance", { precision: 8, scale: 2 }), // in miles or km
  rpe: int("rpe"), // Rate of Perceived Exertion (1-10)
  notes: text("notes"),
  order: int("order").notNull(), // order within workout
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Set = typeof sets.$inferSelect;
export type InsertSet = typeof sets.$inferInsert;

/**
 * Goals table - fitness objectives
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  exerciseId: int("exerciseId"), // optional: link to specific exercise
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).default(
    "0"
  ),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, reps, km, etc.
  status: mysqlEnum("status", ["active", "completed", "abandoned"])
    .default("active")
    .notNull(),
  targetDate: timestamp("targetDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Personal Records table - tracks best performances
 */
export const personalRecords = mysqlTable("personalRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, reps, km, etc.
  setId: int("setId").notNull(), // reference to the set where PR was achieved
  achievedAt: timestamp("achievedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = typeof personalRecords.$inferInsert;

/**
 * AI Insights table - stores generated AI analysis
 */
export const aiInsights = mysqlTable("aiInsights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "performance",
    "suggestion",
    "recovery",
    "trend",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

/**
 * Active workout sessions — in-progress workouts being tracked live
 */
export const activeWorkouts = mysqlTable("activeWorkouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"])
    .default("active")
    .notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
});

export type ActiveWorkout = typeof activeWorkouts.$inferSelect;
export type InsertActiveWorkout = typeof activeWorkouts.$inferInsert;

/**
 * Sets logged during an active workout session
 */
export const activeSets = mysqlTable("activeSets", {
  id: int("id").autoincrement().primaryKey(),
  activeWorkoutId: int("activeWorkoutId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  setNumber: int("setNumber").notNull(),
  reps: int("reps"),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  duration: int("duration"),
  rpe: int("rpe"),
  isWarmup: boolean("isWarmup").default(false).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type ActiveSet = typeof activeSets.$inferSelect;
export type InsertActiveSet = typeof activeSets.$inferInsert;

// ============ Templates & Programs ============

/**
 * Workout templates — reusable workout blueprints
 */
export const workoutTemplates = mysqlTable("workoutTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  estimatedDuration: int("estimatedDuration"), // minutes
  category: varchar("category", { length: 100 }), // "Push", "Pull", "Legs", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;

/**
 * Exercises within a template — ordered with targets
 */
export const templateExercises = mysqlTable("templateExercises", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  order: int("exerciseOrder").notNull(),
  targetSets: int("targetSets").default(3).notNull(),
  targetReps: int("targetReps"),
  targetWeight: decimal("targetWeight", { precision: 8, scale: 2 }),
  restDuration: int("restDuration"), // seconds
  notes: text("exerciseNotes"),
  supersetGroup: int("supersetGroup"), // exercises with same group are a superset
});

export type TemplateExercise = typeof templateExercises.$inferSelect;

/**
 * Programs — weekly schedules of templates
 */
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("programDescription"),
  schedule: json("schedule").$type<Record<string, number | null>>(), // { "monday": templateId, ... }
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;

// ============ RPG Gamification Tables ============

/**
 * Character profile — RPG stats per user
 */
export const characterProfiles = mysqlTable("characterProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalXp: int("totalXp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  prestigeLevel: int("prestigeLevel").default(0).notNull(),
  title: varchar("title", { length: 100 }).default("Rookie").notNull(),
  statSTR: int("statSTR").default(0).notNull(),
  statEND: int("statEND").default(0).notNull(),
  statAGI: int("statAGI").default(0).notNull(),
  statFLX: int("statFLX").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CharacterProfile = typeof characterProfiles.$inferSelect;

/**
 * XP transaction log — audit trail of all XP earned
 */
export const xpTransactions = mysqlTable("xpTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(), // "workout", "pr", "boss", "badge"
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).default("1.00"),
  statType: mysqlEnum("statType", ["STR", "END", "AGI", "FLX"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type XpTransaction = typeof xpTransactions.$inferSelect;

/**
 * Persisted unlocked badges
 */
export const unlockedBadges = mysqlTable("unlockedBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: varchar("badgeId", { length: 100 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UnlockedBadge = typeof unlockedBadges.$inferSelect;

/**
 * Skill nodes — per-muscle-group progression
 */
export const skillNodes = mysqlTable("skillNodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  muscleGroup: varchar("muscleGroup", { length: 100 }).notNull(),
  tier: mysqlEnum("tier", ["novice", "intermediate", "advanced", "master"])
    .default("novice")
    .notNull(),
  xp: int("xp").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SkillNode = typeof skillNodes.$inferSelect;

/**
 * Boss fights — periodic challenges
 */
export const bossFights = mysqlTable("bossFights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "strength",
    "endurance",
    "volume",
    "consistency",
  ]).notNull(),
  description: text("description"),
  targetValue: int("targetValue").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  xpReward: int("xpReward").notNull(),
  status: mysqlEnum("bossStatus", ["active", "defeated", "expired"])
    .default("active")
    .notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BossFight = typeof bossFights.$inferSelect;

/**
 * Loot rewards — earned cosmetics/titles
 */
export const lootRewards = mysqlTable("lootRewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("lootType", ["title", "badge_frame", "theme"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  rarity: mysqlEnum("rarity", [
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
  ]).notNull(),
  metadata: json("lootMetadata").$type<Record<string, unknown>>(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type LootReward = typeof lootRewards.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  exercises: many(exercises),
  workouts: many(workouts),
  goals: many(goals),
  personalRecords: many(personalRecords),
  aiInsights: many(aiInsights),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  user: one(users, { fields: [exercises.userId], references: [users.id] }),
  sets: many(sets),
  goals: many(goals),
  personalRecords: many(personalRecords),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, { fields: [workouts.userId], references: [users.id] }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workout: one(workouts, {
    fields: [sets.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [sets.exerciseId],
    references: [exercises.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  exercise: one(exercises, {
    fields: [goals.exerciseId],
    references: [exercises.id],
  }),
}));

export const personalRecordsRelations = relations(
  personalRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [personalRecords.userId],
      references: [users.id],
    }),
    exercise: one(exercises, {
      fields: [personalRecords.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, { fields: [aiInsights.userId], references: [users.id] }),
}));

export const workoutTemplatesRelations = relations(
  workoutTemplates,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutTemplates.userId],
      references: [users.id],
    }),
    exercises: many(templateExercises),
  })
);

export const templateExercisesRelations = relations(
  templateExercises,
  ({ one }) => ({
    template: one(workoutTemplates, {
      fields: [templateExercises.templateId],
      references: [workoutTemplates.id],
    }),
    exercise: one(exercises, {
      fields: [templateExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const programsRelations = relations(programs, ({ one }) => ({
  user: one(users, {
    fields: [programs.userId],
    references: [users.id],
  }),
}));

export const activeWorkoutsRelations = relations(
  activeWorkouts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [activeWorkouts.userId],
      references: [users.id],
    }),
    sets: many(activeSets),
  })
);

export const activeSetsRelations = relations(activeSets, ({ one }) => ({
  activeWorkout: one(activeWorkouts, {
    fields: [activeSets.activeWorkoutId],
    references: [activeWorkouts.id],
  }),
  exercise: one(exercises, {
    fields: [activeSets.exerciseId],
    references: [exercises.id],
  }),
}));

export const characterProfilesRelations = relations(
  characterProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [characterProfiles.userId],
      references: [users.id],
    }),
  })
);

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, {
    fields: [xpTransactions.userId],
    references: [users.id],
  }),
}));

export const unlockedBadgesRelations = relations(unlockedBadges, ({ one }) => ({
  user: one(users, {
    fields: [unlockedBadges.userId],
    references: [users.id],
  }),
}));

export const skillNodesRelations = relations(skillNodes, ({ one }) => ({
  user: one(users, {
    fields: [skillNodes.userId],
    references: [users.id],
  }),
}));

export const bossFightsRelations = relations(bossFights, ({ one }) => ({
  user: one(users, {
    fields: [bossFights.userId],
    references: [users.id],
  }),
}));

export const lootRewardsRelations = relations(lootRewards, ({ one }) => ({
  user: one(users, {
    fields: [lootRewards.userId],
    references: [users.id],
  }),
}));
