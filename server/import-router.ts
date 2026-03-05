import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  parseStriveBackup,
  parseCSV,
  parseFreeText,
  type ImportPreview,
  type ImportWorkout,
} from "./import-parsers";
import * as db from "./db";

const importWorkoutSchema = z.object({
  name: z.string(),
  date: z.string(), // ISO string
  duration: z.number().optional(),
  notes: z.string().optional(),
  exercises: z.array(
    z.object({
      name: z.string(),
      category: z.enum([
        "strength",
        "cardio",
        "flexibility",
        "sports",
        "other",
      ]),
      muscleGroups: z.array(z.string()),
      sets: z.array(
        z.object({
          reps: z.number(),
          weight: z.number().optional(),
          duration: z.number().optional(),
          rpe: z.number().optional(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
});

export const importRouter = router({
  preview: protectedProcedure
    .input(
      z.object({
        format: z.enum(["strive", "csv", "freetext"]),
        data: z.string(), // base64 for strive, plain text for csv/freetext
      })
    )
    .mutation(async ({ input }): Promise<ImportPreview> => {
      try {
        switch (input.format) {
          case "strive":
            return await parseStriveBackup(input.data);
          case "csv":
            return parseCSV(input.data);
          case "freetext":
            return await parseFreeText(input.data);
        }
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Failed to parse import data",
        });
      }
    }),

  commit: protectedProcedure
    .input(
      z.object({
        workouts: z.array(importWorkoutSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Load existing exercises for case-insensitive dedup
      const existingExercises = await db.getExercisesByUser(userId);
      const exerciseNameMap = new Map<string, number>();
      for (const ex of existingExercises) {
        exerciseNameMap.set(ex.name.toLowerCase(), ex.id);
      }

      let totalWorkouts = 0;
      let totalSets = 0;

      for (const w of input.workouts) {
        // Create workout
        const workoutResult = await db.createWorkout({
          userId,
          name: w.name,
          date: new Date(w.date),
          duration: w.duration,
          notes: w.notes,
        });
        const workoutId =
          (workoutResult as any).insertId ??
          (workoutResult as any)[0]?.insertId;

        let setOrder = 1;
        let totalVolume = 0;

        for (const ex of w.exercises) {
          // Upsert exercise (case-insensitive)
          let exerciseId = exerciseNameMap.get(ex.name.toLowerCase());
          if (!exerciseId) {
            const exResult = await db.createExercise({
              userId,
              name: ex.name,
              category: ex.category,
              muscleGroups: ex.muscleGroups,
              isCustom: true,
            });
            exerciseId =
              (exResult as any).insertId ?? (exResult as any)[0]?.insertId;
            exerciseNameMap.set(ex.name.toLowerCase(), exerciseId!);
          }

          for (const s of ex.sets) {
            await db.createSet({
              workoutId,
              exerciseId: exerciseId!,
              reps: s.reps,
              weight: s.weight != null ? s.weight.toString() : undefined,
              duration: s.duration,
              rpe: s.rpe,
              notes: s.notes,
              order: setOrder++,
            });
            totalSets++;
            if (s.weight && s.reps) {
              totalVolume += s.weight * s.reps;
            }
          }
        }

        // Update totalVolume on the workout
        if (totalVolume > 0) {
          await db.updateWorkout(workoutId, {
            totalVolume: totalVolume.toString(),
          });
        }

        totalWorkouts++;
      }

      // Recalculate RPG XP for historical data
      try {
        const { migrateHistoricalData } = await import("./rpg-engine");
        await migrateHistoricalData(userId);
      } catch (e) {
        console.error("[Import] RPG migration failed:", e);
      }

      return { totalWorkouts, totalSets };
    }),
});
