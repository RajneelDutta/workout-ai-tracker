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
          category: z.enum([
            "strength",
            "cardio",
            "flexibility",
            "sports",
            "other",
          ]),
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
        return await db.getWorkoutsByUser(
          ctx.user.id,
          input.limit,
          input.offset
        );
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
        if (distance !== undefined)
          convertedData.distance = distance.toString();
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
        if (updateData.title !== undefined)
          numericUpdate.title = updateData.title;
        if (updateData.description !== undefined)
          numericUpdate.description = updateData.description;
        if (updateData.status !== undefined)
          numericUpdate.status = updateData.status;
        if (updateData.targetDate !== undefined)
          numericUpdate.targetDate = updateData.targetDate;

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
        return await db.getPersonalRecordByExercise(
          ctx.user.id,
          input.exerciseId
        );
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

  // Active Workout procedures
  activeWorkout: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const workout = await db.getActiveWorkout(ctx.user.id);
      if (!workout) return null;
      const sets = await db.getActiveSets(workout.id);
      return { ...workout, sets };
    }),

    start: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Ensure no other active workout
        const existing = await db.getActiveWorkout(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You already have an active workout",
          });
        }
        const result = await db.createActiveWorkout({
          userId: ctx.user.id,
          name: input.name,
          status: "active",
        });
        const insertId =
          (result as any).insertId ?? (result as any)[0]?.insertId;
        return { id: insertId };
      }),

    logSet: protectedProcedure
      .input(
        z.object({
          exerciseId: z.number(),
          setNumber: z.number(),
          reps: z.number().optional(),
          weight: z.number().optional(),
          duration: z.number().optional(),
          rpe: z.number().min(1).max(10).optional(),
          isWarmup: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const workout = await db.getActiveWorkout(ctx.user.id);
        if (!workout) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active workout",
          });
        }
        const result = await db.createActiveSet({
          activeWorkoutId: workout.id,
          exerciseId: input.exerciseId,
          setNumber: input.setNumber,
          reps: input.reps,
          weight: input.weight?.toString(),
          duration: input.duration,
          rpe: input.rpe,
          isWarmup: input.isWarmup ?? false,
        });
        const insertId =
          (result as any).insertId ?? (result as any)[0]?.insertId;
        return { id: insertId };
      }),

    deleteSet: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const workout = await db.getActiveWorkout(ctx.user.id);
        if (!workout) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active workout",
          });
        }
        return await db.deleteActiveSet(input.id);
      }),

    complete: protectedProcedure
      .input(z.object({ notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const workout = await db.getActiveWorkout(ctx.user.id);
        if (!workout) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active workout",
          });
        }

        const activeSetsData = await db.getActiveSets(workout.id);
        if (activeSetsData.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No sets to save",
          });
        }

        const now = new Date();
        const durationMin = Math.round(
          (now.getTime() - new Date(workout.startedAt).getTime()) / 60000
        );

        // Calculate total volume
        let totalVolume = 0;
        for (const s of activeSetsData) {
          if (s.reps && s.weight) {
            totalVolume += s.reps * Number(s.weight);
          }
        }

        // Create permanent workout
        const workoutResult = await db.createWorkout({
          userId: ctx.user.id,
          name: workout.name,
          date: new Date(workout.startedAt),
          duration: durationMin,
          notes: input.notes ?? workout.notes,
          totalVolume: totalVolume > 0 ? totalVolume.toString() : undefined,
        });
        const workoutId =
          (workoutResult as any).insertId ??
          (workoutResult as any)[0]?.insertId;

        // Copy sets to permanent table
        const newPRs: Array<{
          exerciseId: number;
          weight: number;
          setId: number;
        }> = [];
        for (let i = 0; i < activeSetsData.length; i++) {
          const s = activeSetsData[i];
          const setResult = await db.createSet({
            workoutId,
            exerciseId: s.exerciseId,
            reps: s.reps ?? 0,
            weight: s.weight,
            duration: s.duration,
            rpe: s.rpe,
            order: i + 1,
          });
          const setId =
            (setResult as any).insertId ?? (setResult as any)[0]?.insertId;

          // Check for PRs (weight-based)
          if (s.weight && Number(s.weight) > 0) {
            const existingPR = await db.getPersonalRecordByExercise(
              ctx.user.id,
              s.exerciseId
            );
            if (!existingPR || Number(s.weight) > Number(existingPR.value)) {
              await db.createPersonalRecord({
                userId: ctx.user.id,
                exerciseId: s.exerciseId,
                value: s.weight,
                unit: "kg",
                setId,
                achievedAt: now,
              });
              newPRs.push({
                exerciseId: s.exerciseId,
                weight: Number(s.weight),
                setId,
              });
            }
          }
        }

        // Mark active workout completed
        await db.updateActiveWorkout(workout.id, {
          status: "completed",
          completedAt: now,
        });

        // Process RPG XP
        // Get exercise categories for stat routing
        const exerciseCategories: string[] = [];
        for (const s of activeSetsData) {
          const exercise = await db.getExerciseById(s.exerciseId);
          if (exercise) exerciseCategories.push(exercise.category);
        }

        // Calculate streak
        const recentWorkouts = await db.getWorkoutsByUser(ctx.user.id, 100, 0);
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sortedDates = Array.from(
          new Set(
            recentWorkouts.map(w => {
              const d = new Date(w.date);
              d.setHours(0, 0, 0, 0);
              return d.getTime();
            })
          )
        ).sort((a, b) => b - a);
        if (sortedDates.length > 0) {
          const latest = sortedDates[0];
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (latest === today.getTime() || latest === yesterday.getTime()) {
            streak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
              if (sortedDates[i - 1] - sortedDates[i] === 86400000) streak++;
              else break;
            }
          }
        }

        let rpgResult = null;
        try {
          const { processWorkoutXP } = await import("./rpg-engine");
          rpgResult = await processWorkoutXP(ctx.user.id, {
            totalVolume,
            totalSets: activeSetsData.length,
            newPRCount: newPRs.length,
            exerciseCategories,
            currentStreak: streak,
          });
        } catch (e) {
          console.error("[RPG] Failed to process XP:", e);
        }

        return {
          workoutId,
          duration: durationMin,
          totalVolume,
          totalSets: activeSetsData.length,
          newPRs,
          rpg: rpgResult,
        };
      }),

    discard: protectedProcedure.mutation(async ({ ctx }) => {
      const workout = await db.getActiveWorkout(ctx.user.id);
      if (!workout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active workout",
        });
      }
      await db.deleteActiveSetsForWorkout(workout.id);
      await db.deleteActiveWorkout(workout.id);
      return { success: true };
    }),

    lastSets: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLastSetsForExercise(ctx.user.id, input.exerciseId);
      }),
  }),

  // Template procedures
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const templates = await db.getTemplatesByUser(ctx.user.id);
      // Include exercise count
      const result = [];
      for (const t of templates) {
        const exercises = await db.getTemplateExercises(t.id);
        result.push({ ...t, exerciseCount: exercises.length });
      }
      return result;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const template = await db.getTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const exercises = await db.getTemplateExercises(input.id);
        return { ...template, exercises };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          estimatedDuration: z.number().optional(),
          category: z.string().optional(),
          exercises: z.array(
            z.object({
              exerciseId: z.number(),
              order: z.number(),
              targetSets: z.number().default(3),
              targetReps: z.number().optional(),
              targetWeight: z.number().optional(),
              restDuration: z.number().optional(),
              notes: z.string().optional(),
              supersetGroup: z.number().optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createTemplate({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          estimatedDuration: input.estimatedDuration,
          category: input.category,
        });
        const templateId =
          (result as any).insertId ?? (result as any)[0]?.insertId;

        if (input.exercises.length > 0) {
          await db.setTemplateExercises(
            templateId,
            input.exercises.map(e => ({
              templateId,
              exerciseId: e.exerciseId,
              order: e.order,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
              targetWeight: e.targetWeight?.toString(),
              restDuration: e.restDuration,
              notes: e.notes,
              supersetGroup: e.supersetGroup,
            }))
          );
        }
        return { id: templateId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          estimatedDuration: z.number().optional(),
          category: z.string().optional(),
          exercises: z
            .array(
              z.object({
                exerciseId: z.number(),
                order: z.number(),
                targetSets: z.number().default(3),
                targetReps: z.number().optional(),
                targetWeight: z.number().optional(),
                restDuration: z.number().optional(),
                notes: z.string().optional(),
                supersetGroup: z.number().optional(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const template = await db.getTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, exercises, ...data } = input;
        if (Object.keys(data).length > 0) {
          await db.updateTemplate(id, data);
        }
        if (exercises) {
          await db.setTemplateExercises(
            id,
            exercises.map(e => ({
              templateId: id,
              exerciseId: e.exerciseId,
              order: e.order,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
              targetWeight: e.targetWeight?.toString(),
              restDuration: e.restDuration,
              notes: e.notes,
              supersetGroup: e.supersetGroup,
            }))
          );
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.deleteTemplate(input.id);
      }),
  }),

  // Program procedures
  programs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProgramsByUser(ctx.user.id);
    }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
      const program = await db.getActiveProgram(ctx.user.id);
      if (!program || !program.schedule) return null;

      const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const today = days[new Date().getDay()];
      const templateId = program.schedule[today];
      if (!templateId) return null;

      const template = await db.getTemplateById(templateId);
      if (!template) return null;

      const exercises = await db.getTemplateExercises(templateId);
      return { program, template: { ...template, exercises } };
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          schedule: z.record(z.string(), z.number().nullable()),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createProgram({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          schedule: input.schedule,
          isActive: input.isActive,
        });
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          schedule: z.record(z.string(), z.number().nullable()).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateProgram(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteProgram(input.id);
      }),
  }),

  // Progression procedures
  progression: router({
    getSuggestion: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getProgressionSuggestion } = await import("./progression");
        return await getProgressionSuggestion(ctx.user.id, input.exerciseId);
      }),

    get1RM: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { estimate1RM } = await import("./progression");
        return await estimate1RM(ctx.user.id, input.exerciseId);
      }),
  }),

  // Character / RPG procedures
  character: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const { getOrCreateProfile, getStreak } = await import("./rpg-engine");
      const profile = await getOrCreateProfile(ctx.user.id);
      const streak = await getStreak(ctx.user.id);
      return { ...profile, streak };
    }),

    getXPHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        const { getXPHistory } = await import("./rpg-engine");
        return await getXPHistory(ctx.user.id, input.limit);
      }),

    getSkillTree: protectedProcedure.query(async ({ ctx }) => {
      const { getSkillTree } = await import("./rpg-engine");
      return await getSkillTree(ctx.user.id);
    }),

    getBadges: protectedProcedure.query(async ({ ctx }) => {
      const { getBadges } = await import("./rpg-engine");
      return await getBadges(ctx.user.id);
    }),

    getBossFights: protectedProcedure.query(async ({ ctx }) => {
      const { getAllBossFights } = await import("./rpg-engine");
      return await getAllBossFights(ctx.user.id);
    }),

    getActiveBossFights: protectedProcedure.query(async ({ ctx }) => {
      const { getActiveBossFights } = await import("./rpg-engine");
      return await getActiveBossFights(ctx.user.id);
    }),

    getLoot: protectedProcedure.query(async ({ ctx }) => {
      const { getLoot } = await import("./rpg-engine");
      return await getLoot(ctx.user.id);
    }),

    migrate: protectedProcedure.mutation(async ({ ctx }) => {
      const { migrateHistoricalData } = await import("./rpg-engine");
      return await migrateHistoricalData(ctx.user.id);
    }),

    spawnBoss: protectedProcedure.mutation(async ({ ctx }) => {
      const { generateBossFight } = await import("./rpg-engine");
      await generateBossFight(ctx.user.id);
      return { success: true };
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
        return await db.getWorkoutStats(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),

    getExerciseHistory: protectedProcedure
      .input(
        z.object({
          exerciseId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getExerciseHistory(
          ctx.user.id,
          input.exerciseId,
          input.limit
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;
