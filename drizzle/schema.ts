import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
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
  category: mysqlEnum("category", ["strength", "cardio", "flexibility", "sports", "other"]).notNull(),
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
  weight: decimal("weight", { precision: 8, scale: 2 }), // in lbs or kg
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
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 50 }).notNull(), // lbs, reps, miles, etc.
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
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
  unit: varchar("unit", { length: 50 }).notNull(), // lbs, reps, miles, etc.
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
  type: mysqlEnum("type", ["performance", "suggestion", "recovery", "trend"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

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
  workout: one(workouts, { fields: [sets.workoutId], references: [workouts.id] }),
  exercise: one(exercises, { fields: [sets.exerciseId], references: [exercises.id] }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  exercise: one(exercises, { fields: [goals.exerciseId], references: [exercises.id] }),
}));

export const personalRecordsRelations = relations(personalRecords, ({ one }) => ({
  user: one(users, { fields: [personalRecords.userId], references: [users.id] }),
  exercise: one(exercises, { fields: [personalRecords.exerciseId], references: [exercises.id] }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, { fields: [aiInsights.userId], references: [users.id] }),
}));
