import Groq from "groq-sdk";
import * as db from "./db";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateWorkoutAnalysis(userId: number, workoutId: number) {
  try {
    const workout = await db.getWorkoutById(workoutId);
    if (!workout || workout.userId !== userId) {
      throw new Error("Workout not found");
    }

    const sets = await db.getSetsByWorkout(workoutId);
    const exercises = await Promise.all(
      sets.map((s) => db.getExerciseById(s.exerciseId))
    );

    const workoutSummary = `
Workout: ${workout.name}
Date: ${new Date(workout.date).toLocaleDateString()}
Duration: ${workout.duration} minutes
Exercises: ${exercises.map((e) => e?.name).join(", ")}
Total Sets: ${sets.length}
Notes: ${workout.notes || "None"}

Set Details:
${sets
  .map(
    (s, i) => `
Set ${i + 1}: ${exercises[i]?.name}
- Reps: ${s.reps}
- Weight: ${s.weight ? `${s.weight} lbs` : "Bodyweight"}
- RPE: ${s.rpe || "Not recorded"}
- Notes: ${s.notes || "None"}
`
  )
  .join("\n")}
    `;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional fitness coach. Analyze this workout session and provide brief, actionable insights about the performance, form cues, and suggestions for improvement. Keep it concise and motivating.\n\n${workoutSummary}`,
        },
      ],
    });

    const analysis = message.choices[0]?.message?.content || "";

    await db.createAIInsight({
      userId,
      type: "performance",
      title: "Workout Analysis",
      content: analysis,
      metadata: { workoutId },
    });

    return analysis;
  } catch (error) {
    console.error("Error generating workout analysis:", error);
    throw error;
  }
}

export async function generateWorkoutSuggestions(userId: number) {
  try {
    const workouts = await db.getWorkoutsByUser(userId, 10);
    const goals = await db.getGoalsByUser(userId);
    const prs = await db.getPersonalRecordsByUser(userId);

    if (workouts.length === 0) {
      return "Start by logging your first workout to get personalized suggestions!";
    }

    const workoutSummary = `
Recent Workouts: ${workouts.length}
Active Goals: ${goals.filter((g) => g.status === "active").length}
Personal Records: ${prs.length}

Recent Workout Types:
${workouts
  .slice(0, 5)
  .map((w) => `- ${w.name} (${new Date(w.date).toLocaleDateString()})`)
  .join("\n")}

Active Goals:
${goals
  .filter((g) => g.status === "active")
  .map((g) => `- ${g.title}: ${g.currentValue}/${g.targetValue} ${g.unit}`)
  .join("\n")}
    `;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional fitness coach. Based on this user's recent workout history and goals, suggest 3-4 specific workout ideas for their next session. Consider recovery, progression, and goal alignment. Be specific about exercises and rep ranges.\n\n${workoutSummary}`,
        },
      ],
    });

    const suggestions = message.choices[0]?.message?.content || "";

    await db.createAIInsight({
      userId,
      type: "suggestion",
      title: "Personalized Workout Suggestions",
      content: suggestions,
    });

    return suggestions;
  } catch (error) {
    console.error("Error generating workout suggestions:", error);
    throw error;
  }
}

export async function generateProgressInsights(userId: number) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const workouts = await db.getWorkoutStats(userId, thirtyDaysAgo, new Date());
    const goals = await db.getGoalsByUser(userId);
    const prs = await db.getPersonalRecordsByUser(userId);

    const progressSummary = `
Last 30 Days:
- Total Workouts: ${workouts?.length || 0}
- Active Goals: ${goals.filter((g) => g.status === "active").length}
- Completed Goals: ${goals.filter((g) => g.status === "completed").length}
- New Personal Records: ${prs.filter((pr) => new Date(pr.achievedAt) > thirtyDaysAgo).length}

Goal Progress:
${goals
  .filter((g) => g.status === "active")
  .map((g) => {
    const progress = (parseFloat(g.currentValue || "0") / parseFloat(g.targetValue)) * 100;
    return `- ${g.title}: ${progress.toFixed(0)}% complete`;
  })
  .join("\n")}
    `;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional fitness coach. Analyze this user's progress over the last 30 days and provide encouraging, specific insights about their trends, consistency, and areas for improvement. Highlight wins and suggest focus areas.\n\n${progressSummary}`,
        },
      ],
    });

    const insights = message.choices[0]?.message?.content || "";

    await db.createAIInsight({
      userId,
      type: "trend",
      title: "30-Day Progress Insights",
      content: insights,
    });

    return insights;
  } catch (error) {
    console.error("Error generating progress insights:", error);
    throw error;
  }
}

export async function generateRecoveryRecommendations(userId: number) {
  try {
    const workouts = await db.getWorkoutsByUser(userId, 20);

    if (workouts.length < 3) {
      return "Log more workouts to get personalized recovery recommendations!";
    }

    const recentWorkouts = workouts.slice(0, 10);
    const workoutFrequency = `
Recent Workout Pattern:
${recentWorkouts.map((w) => `- ${w.name}: ${new Date(w.date).toLocaleDateString()}`).join("\n")}
    `;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional fitness coach. Based on this user's recent workout frequency and types, provide specific recovery and rest recommendations. Include sleep, nutrition, and active recovery suggestions.\n\n${workoutFrequency}`,
        },
      ],
    });

    const recommendations = message.choices[0]?.message?.content || "";

    await db.createAIInsight({
      userId,
      type: "recovery",
      title: "Recovery Recommendations",
      content: recommendations,
    });

    return recommendations;
  } catch (error) {
    console.error("Error generating recovery recommendations:", error);
    throw error;
  }
}
