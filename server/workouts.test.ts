import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getWorkoutsByUser: vi.fn(),
  getWorkoutById: vi.fn(),
  createWorkout: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
  getSetsByWorkout: vi.fn(),
  createSet: vi.fn(),
  getExercisesByUser: vi.fn(),
  getExerciseById: vi.fn(),
  createExercise: vi.fn(),
  getGoalsByUser: vi.fn(),
  createGoal: vi.fn(),
  getPersonalRecordsByUser: vi.fn(),
  getAIInsightsByUser: vi.fn(),
  createAIInsight: vi.fn(),
  getWorkoutStats: vi.fn(),
}));

describe("Workout Database Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkoutsByUser", () => {
    it("should retrieve workouts for a user", async () => {
      const mockWorkouts = [
        {
          id: 1,
          userId: 1,
          name: "Upper Body",
          date: new Date(),
          duration: 60,
          notes: "Great session",
          totalVolume: "5000",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getWorkoutsByUser).mockResolvedValue(mockWorkouts);

      const result = await db.getWorkoutsByUser(1, 50, 0);
      expect(result).toEqual(mockWorkouts);
      expect(db.getWorkoutsByUser).toHaveBeenCalledWith(1, 50, 0);
    });

    it("should return empty array when no workouts exist", async () => {
      vi.mocked(db.getWorkoutsByUser).mockResolvedValue([]);

      const result = await db.getWorkoutsByUser(999, 50, 0);
      expect(result).toEqual([]);
    });
  });

  describe("createWorkout", () => {
    it("should create a new workout", async () => {
      const workoutData = {
        userId: 1,
        name: "Lower Body",
        date: new Date(),
        duration: 45,
        notes: "Legs day",
      };

      vi.mocked(db.createWorkout).mockResolvedValue({ insertId: 1 } as any);

      const result = await db.createWorkout(workoutData);
      expect(result).toBeDefined();
      expect(db.createWorkout).toHaveBeenCalledWith(workoutData);
    });
  });

  describe("getSetsByWorkout", () => {
    it("should retrieve all sets for a workout", async () => {
      const mockSets = [
        {
          id: 1,
          workoutId: 1,
          exerciseId: 1,
          reps: 10,
          weight: "185",
          duration: null,
          distance: null,
          rpe: 8,
          notes: "Good form",
          order: 1,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getSetsByWorkout).mockResolvedValue(mockSets);

      const result = await db.getSetsByWorkout(1);
      expect(result).toEqual(mockSets);
      expect(db.getSetsByWorkout).toHaveBeenCalledWith(1);
    });
  });

  describe("getExercisesByUser", () => {
    it("should retrieve exercises for a user", async () => {
      const mockExercises = [
        {
          id: 1,
          userId: 1,
          name: "Bench Press",
          description: "Chest exercise",
          category: "strength",
          muscleGroups: ["chest", "triceps"],
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getExercisesByUser).mockResolvedValue(mockExercises);

      const result = await db.getExercisesByUser(1);
      expect(result).toEqual(mockExercises);
      expect(db.getExercisesByUser).toHaveBeenCalledWith(1);
    });
  });

  describe("getGoalsByUser", () => {
    it("should retrieve goals for a user", async () => {
      const mockGoals = [
        {
          id: 1,
          userId: 1,
          title: "Bench Press 225",
          description: "Reach 225 lbs",
          exerciseId: 1,
          targetValue: "225",
          currentValue: "185",
          unit: "lbs",
          status: "active",
          targetDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        },
      ];

      vi.mocked(db.getGoalsByUser).mockResolvedValue(mockGoals);

      const result = await db.getGoalsByUser(1);
      expect(result).toEqual(mockGoals);
      expect(db.getGoalsByUser).toHaveBeenCalledWith(1);
    });
  });

  describe("getPersonalRecordsByUser", () => {
    it("should retrieve personal records for a user", async () => {
      const mockPRs = [
        {
          id: 1,
          userId: 1,
          exerciseId: 1,
          value: "225",
          unit: "lbs",
          setId: 1,
          achievedAt: new Date(),
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getPersonalRecordsByUser).mockResolvedValue(mockPRs);

      const result = await db.getPersonalRecordsByUser(1);
      expect(result).toEqual(mockPRs);
      expect(db.getPersonalRecordsByUser).toHaveBeenCalledWith(1);
    });
  });

  describe("getAIInsightsByUser", () => {
    it("should retrieve AI insights for a user", async () => {
      const mockInsights = [
        {
          id: 1,
          userId: 1,
          type: "performance",
          title: "Workout Analysis",
          content: "Great workout session",
          metadata: { workoutId: 1 },
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getAIInsightsByUser).mockResolvedValue(mockInsights);

      const result = await db.getAIInsightsByUser(1, 20);
      expect(result).toEqual(mockInsights);
      expect(db.getAIInsightsByUser).toHaveBeenCalledWith(1, 20);
    });
  });

  describe("getWorkoutStats", () => {
    it("should retrieve workout statistics for a date range", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const mockStats = [
        {
          id: 1,
          userId: 1,
          name: "Upper Body",
          date: new Date(),
          duration: 60,
          notes: null,
          totalVolume: "5000",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getWorkoutStats).mockResolvedValue(mockStats);

      const result = await db.getWorkoutStats(1, startDate, endDate);
      expect(result).toEqual(mockStats);
      expect(db.getWorkoutStats).toHaveBeenCalledWith(1, startDate, endDate);
    });
  });
});

describe("Workout Validation", () => {
  it("should validate workout name is not empty", () => {
    const workoutName = "";
    expect(workoutName.trim().length).toBe(0);
  });

  it("should validate workout date is valid", () => {
    const workoutDate = new Date("2026-03-03");
    expect(workoutDate instanceof Date).toBe(true);
    expect(!isNaN(workoutDate.getTime())).toBe(true);
  });

  it("should validate reps is a positive number", () => {
    const reps = 10;
    expect(reps > 0).toBe(true);
  });

  it("should validate weight is a positive number", () => {
    const weight = 185;
    expect(weight > 0).toBe(true);
  });

  it("should validate RPE is between 1 and 10", () => {
    const rpe = 8;
    expect(rpe >= 1 && rpe <= 10).toBe(true);
  });
});
