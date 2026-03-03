import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Exercise procedures
  exercises: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getExercisesByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getExerciseById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.enum(["strength", "cardio", "flexibility", "sports", "other"]),
          muscleGroups: z.array(z.string()),
          isCustom: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createExercise({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          muscleGroups: input.muscleGroups,
          isCustom: input.isCustom ?? false,
        });
      }),
  }),

  // Workout procedures
  workouts: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getWorkoutsByUser(ctx.user.id, input.limit, input.offset);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const workout = await db.getWorkoutById(input.id);
        if (!workout || workout.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const workoutSets = await db.getSetsByWorkout(input.id);
        return { ...workout, sets: workoutSets };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          date: z.date(),
          duration: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createWorkout({
          userId: ctx.user.id,
          name: input.name,
          date: input.date,
          duration: input.duration,
          notes: input.notes,
        });
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          date: z.date().optional(),
          duration: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const workout = await db.getWorkoutById(input.id);
        if (!workout || workout.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, ...updateData } = input;
        return await db.updateWorkout(id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const workout = await db.getWorkoutById(input.id);
        if (!workout || workout.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.deleteWorkout(input.id);
      }),
  }),

  // Sets procedures
  sets: router({
    create: protectedProcedure
      .input(
        z.object({
          workoutId: z.number(),
          exerciseId: z.number(),
          reps: z.number(),
          weight: z.number().optional(),
          duration: z.number().optional(),
          distance: z.number().optional(),
          rpe: z.number().min(1).max(10).optional(),
          notes: z.string().optional(),
          order: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const workout = await db.getWorkoutById(input.workoutId);
        if (!workout || workout.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.createSet({
          workoutId: input.workoutId,
          exerciseId: input.exerciseId,
          reps: input.reps,
          weight: input.weight ? input.weight.toString() : undefined,
          duration: input.duration,
          distance: input.distance ? input.distance.toString() : undefined,
          rpe: input.rpe,
          notes: input.notes,
          order: input.order,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          reps: z.number().optional(),
          weight: z.number().optional(),
          duration: z.number().optional(),
          distance: z.number().optional(),
          rpe: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, weight, distance, ...updateData } = input;
        const convertedData: Record<string, unknown> = { ...updateData };
        if (weight !== undefined) convertedData.weight = weight.toString();
        if (distance !== undefined) convertedData.distance = distance.toString();
        return await db.updateSet(id, convertedData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteSet(input.id);
      }),
  }),

  // Goals procedures
  goals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getGoalsByUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          exerciseId: z.number().optional(),
          targetValue: z.number(),
          unit: z.string(),
          targetDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createGoal({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          exerciseId: input.exerciseId,
          targetValue: input.targetValue.toString(),
          unit: input.unit,
          targetDate: input.targetDate,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          currentValue: z.number().optional(),
          status: z.enum(["active", "completed", "abandoned"]).optional(),
          targetDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const numericUpdate: Record<string, unknown> = {};
        
        if (updateData.currentValue !== undefined) {
          numericUpdate.currentValue = updateData.currentValue.toString();
        } else {
          delete updateData.currentValue;
        }
        if (updateData.title !== undefined) numericUpdate.title = updateData.title;
        if (updateData.description !== undefined) numericUpdate.description = updateData.description;
        if (updateData.status !== undefined) numericUpdate.status = updateData.status;
        if (updateData.targetDate !== undefined) numericUpdate.targetDate = updateData.targetDate;
        
        return await db.updateGoal(id, numericUpdate);
      }),
  }),

  // Personal Records procedures
  personalRecords: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPersonalRecordsByUser(ctx.user.id);
    }),

    getByExercise: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPersonalRecordByExercise(ctx.user.id, input.exerciseId);
      }),
  }),

  // AI Insights procedures
  aiInsights: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return await db.getAIInsightsByUser(ctx.user.id, input.limit);
      }),

    analyzeWorkout: protectedProcedure
      .input(z.object({ workoutId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { generateWorkoutAnalysis } = await import("./ai-insights");
        return await generateWorkoutAnalysis(ctx.user.id, input.workoutId);
      }),

    getSuggestions: protectedProcedure.mutation(async ({ ctx }) => {
      const { generateWorkoutSuggestions } = await import("./ai-insights");
      return await generateWorkoutSuggestions(ctx.user.id);
    }),

    getProgressInsights: protectedProcedure.mutation(async ({ ctx }) => {
      const { generateProgressInsights } = await import("./ai-insights");
      return await generateProgressInsights(ctx.user.id);
    }),

    getRecoveryRecommendations: protectedProcedure.mutation(async ({ ctx }) => {
      const { generateRecoveryRecommendations } = await import("./ai-insights");
      return await generateRecoveryRecommendations(ctx.user.id);
    }),
  }),

  // Analytics procedures
  analytics: router({
    getStats: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getWorkoutStats(ctx.user.id, input.startDate, input.endDate);
      }),

    getExerciseHistory: protectedProcedure
      .input(
        z.object({
          exerciseId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getExerciseHistory(ctx.user.id, input.exerciseId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
