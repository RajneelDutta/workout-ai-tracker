import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import Groq from "groq-sdk";

// ── Shared types ──────────────────────────────────────────────────────

export interface ImportSet {
  reps: number;
  weight?: number; // kg
  duration?: number; // seconds
  rpe?: number;
  notes?: string;
}

export interface ImportExercise {
  name: string;
  category: "strength" | "cardio" | "flexibility" | "sports" | "other";
  muscleGroups: string[];
  sets: ImportSet[];
}

export interface ImportWorkout {
  name: string;
  date: Date;
  duration?: number; // minutes
  notes?: string;
  exercises: ImportExercise[];
}

export interface ImportPreview {
  format: "strive" | "csv" | "freetext";
  workouts: ImportWorkout[];
  totalWorkouts: number;
  totalSets: number;
  dateRange: { earliest: string; latest: string } | null;
  warnings: string[];
}

// ── Strive category mapping ───────────────────────────────────────────

const STRIVE_CATEGORY_MAP: Record<
  string,
  "strength" | "cardio" | "flexibility" | "sports" | "other"
> = {
  barbell: "strength",
  dumbell: "strength",
  dumbbell: "strength",
  machine: "strength",
  cable: "strength",
  bodyweight: "strength",
  cardio: "cardio",
  stretching: "flexibility",
  sport: "sports",
};

function mapStriveCategory(
  cat: string | null
): "strength" | "cardio" | "flexibility" | "sports" | "other" {
  if (!cat) return "other";
  return STRIVE_CATEGORY_MAP[cat.toLowerCase()] ?? "other";
}

// ── Strive .db parser ─────────────────────────────────────────────────

export async function parseStriveBackup(
  base64: string
): Promise<ImportPreview> {
  const Database = (await import("better-sqlite3")).default;

  const buf = Buffer.from(base64, "base64");
  const tmpPath = join(tmpdir(), `strive-import-${Date.now()}.db`);
  writeFileSync(tmpPath, buf);

  const warnings: string[] = [];

  try {
    const db = new Database(tmpPath, { readonly: true });

    // Read exercises
    const exerciseRows = db
      .prepare(
        `SELECT id, name_en, name_pl, category, body_parts, secondary_body_parts
         FROM exercises WHERE deleted_at IS NULL`
      )
      .all() as Array<{
      id: number;
      name_en: string | null;
      name_pl: string | null;
      category: string | null;
      body_parts: string | null;
      secondary_body_parts: string | null;
    }>;

    const exerciseMap = new Map<
      number,
      { name: string; category: string; muscleGroups: string[] }
    >();
    for (const row of exerciseRows) {
      const name = row.name_en || row.name_pl || `Exercise ${row.id}`;
      const parts = [row.body_parts, row.secondary_body_parts]
        .filter(Boolean)
        .flatMap(p => p!.split(",").map(s => s.trim()))
        .filter(Boolean);
      exerciseMap.set(row.id, {
        name,
        category: row.category ?? "other",
        muscleGroups: parts,
      });
    }

    // Read workouts with sets
    const workoutRows = db
      .prepare(
        `SELECT id, name, started_at, ended_at
         FROM routine_logs
         ORDER BY created_at ASC`
      )
      .all() as Array<{
      id: number;
      name: string | null;
      started_at: number | null;
      ended_at: number | null;
    }>;

    const workouts: ImportWorkout[] = [];

    for (const wRow of workoutRows) {
      const setRows = db
        .prepare(
          `SELECT resl.exercise_id, resl.reps, resl.weight,
                  resl.is_weight_unit_metric, resl.distance, resl.rpe,
                  rel."order" AS ex_order, resl."order" AS set_order
           FROM routine_exercise_set_logs resl
           JOIN routine_exercise_logs rel ON resl.routine_exercise_log_id = rel.id
           WHERE rel.routine_log_id = ?
           ORDER BY rel."order" ASC, resl."order" ASC`
        )
        .all(wRow.id) as Array<{
        exercise_id: number;
        reps: number | null;
        weight: number | null;
        is_weight_unit_metric: number | null;
        distance: number | null;
        rpe: number | null;
        ex_order: number;
        set_order: number;
      }>;

      if (setRows.length === 0) continue;

      // Group sets by exercise
      const exerciseGroups = new Map<number, ImportSet[]>();
      for (const s of setRows) {
        let weightKg: number | undefined;
        if (s.weight != null && s.weight > 0) {
          weightKg = s.is_weight_unit_metric
            ? s.weight
            : Math.round(s.weight * 0.453592 * 100) / 100;
        }
        const importSet: ImportSet = {
          reps: s.reps ?? 0,
          weight: weightKg,
          duration: s.distance != null ? undefined : undefined,
          rpe: s.rpe ?? undefined,
        };
        const group = exerciseGroups.get(s.exercise_id);
        if (group) group.push(importSet);
        else exerciseGroups.set(s.exercise_id, [importSet]);
      }

      const exercises: ImportExercise[] = [];
      for (const [exId, sets] of Array.from(exerciseGroups.entries())) {
        const info = exerciseMap.get(exId);
        if (!info) {
          warnings.push(
            `Unknown exercise ID ${exId} in workout "${wRow.name}"`
          );
          continue;
        }
        exercises.push({
          name: info.name,
          category: mapStriveCategory(info.category),
          muscleGroups: info.muscleGroups,
          sets,
        });
      }

      const startDate = wRow.started_at
        ? new Date(wRow.started_at * 1000)
        : new Date();
      const durationMin =
        wRow.started_at && wRow.ended_at
          ? Math.round((wRow.ended_at - wRow.started_at) / 60)
          : undefined;

      workouts.push({
        name: wRow.name || "Workout",
        date: startDate,
        duration: durationMin,
        exercises,
      });
    }

    db.close();

    return buildPreview("strive", workouts, warnings);
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {}
  }
}

// ── CSV parser ────────────────────────────────────────────────────────
// Expected columns:
// date,workout_name,exercise_name,category,reps,weight_kg,duration_sec,rpe,notes

export function parseCSV(text: string): ImportPreview {
  const warnings: string[] = [];
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return buildPreview("csv", [], ["CSV file is empty or has no data rows"]);
  }

  const header = lines[0].toLowerCase();
  const expectedCols = [
    "date",
    "workout_name",
    "exercise_name",
    "category",
    "reps",
    "weight_kg",
  ];
  const hasHeader = expectedCols.some(c => header.includes(c));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Group by (date, workout_name) → exercises → sets
  const workoutMap = new Map<
    string,
    { name: string; date: Date; exercises: Map<string, ImportExercise> }
  >();

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCSVLine(dataLines[i]);
    if (cols.length < 5) {
      warnings.push(`Row ${i + 1}: skipped (fewer than 5 columns)`);
      continue;
    }

    const [dateStr, workoutName, exerciseName, category, repsStr] = cols;
    const weightStr = cols[5] ?? "";
    const durationStr = cols[6] ?? "";
    const rpeStr = cols[7] ?? "";
    const notes = cols[8] ?? "";

    const date = parseDate(dateStr);
    if (!date) {
      warnings.push(`Row ${i + 1}: invalid date "${dateStr}"`);
      continue;
    }

    const key = `${date.toISOString().slice(0, 10)}|${workoutName || "Workout"}`;
    if (!workoutMap.has(key)) {
      workoutMap.set(key, {
        name: workoutName || "Workout",
        date,
        exercises: new Map(),
      });
    }

    const workout = workoutMap.get(key)!;
    const exName = exerciseName || "Unknown Exercise";
    if (!workout.exercises.has(exName)) {
      workout.exercises.set(exName, {
        name: exName,
        category: validateCategory(category),
        muscleGroups: [],
        sets: [],
      });
    }

    const reps = parseInt(repsStr) || 0;
    const weight = parseFloat(weightStr) || undefined;
    const duration = parseInt(durationStr) || undefined;
    const rpe = parseInt(rpeStr) || undefined;

    workout.exercises.get(exName)!.sets.push({
      reps,
      weight,
      duration,
      rpe,
      notes: notes || undefined,
    });
  }

  const workouts: ImportWorkout[] = [];
  for (const w of Array.from(workoutMap.values())) {
    workouts.push({
      name: w.name,
      date: w.date,
      exercises: Array.from(w.exercises.values()),
    });
  }

  return buildPreview("csv", workouts, warnings);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(s: string): Date | null {
  // Try ISO (YYYY-MM-DD), then DD/MM/YYYY, then MM/DD/YYYY
  const iso = Date.parse(s);
  if (!isNaN(iso)) return new Date(iso);

  const parts = s.split(/[/\-.]/).map(Number);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // DD/MM/YYYY
    if (a <= 31 && b <= 12 && c >= 1900) return new Date(c, b - 1, a);
    // MM/DD/YYYY
    if (a <= 12 && b <= 31 && c >= 1900) return new Date(c, a - 1, b);
  }
  return null;
}

function validateCategory(
  s: string
): "strength" | "cardio" | "flexibility" | "sports" | "other" {
  const valid = ["strength", "cardio", "flexibility", "sports", "other"];
  const lower = (s || "").toLowerCase().trim();
  return (valid.includes(lower) ? lower : "other") as
    | "strength"
    | "cardio"
    | "flexibility"
    | "sports"
    | "other";
}

// ── Freetext parser (Groq LLM) ───────────────────────────────────────

export async function parseFreeText(text: string): Promise<ImportPreview> {
  const warnings: string[] = [];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const today = new Date().toISOString().slice(0, 10);

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a workout data extractor. Today is ${today}. Given freeform text describing workouts, extract structured data. Return JSON with this exact shape:
{
  "workouts": [
    {
      "name": "workout name",
      "date": "YYYY-MM-DD",
      "duration": null,
      "notes": null,
      "exercises": [
        {
          "name": "exercise name (use standard name, e.g. Bench Press, Squat, Deadlift)",
          "category": "strength|cardio|flexibility|sports|other",
          "muscleGroups": ["chest", "triceps"],
          "sets": [
            { "reps": 8, "weight": 80, "rpe": null, "notes": null }
          ]
        }
      ]
    }
  ]
}

Rules:
- Weight is always in kg. Convert lbs to kg (multiply by 0.4536) if the user specifies lbs.
- "yesterday" = one day before today, "last Monday" = most recent Monday, etc.
- If "3x8 bench at 80kg" → 3 sets, each 8 reps at 80kg.
- If no date mentioned, use today.
- Use standard exercise names with proper capitalization.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return buildPreview("freetext", [], ["AI returned empty response"]);
  }

  try {
    const parsed = JSON.parse(content) as {
      workouts: Array<{
        name: string;
        date: string;
        duration?: number | null;
        notes?: string | null;
        exercises: Array<{
          name: string;
          category: string;
          muscleGroups: string[];
          sets: Array<{
            reps: number;
            weight?: number | null;
            duration?: number | null;
            rpe?: number | null;
            notes?: string | null;
          }>;
        }>;
      }>;
    };

    const workouts: ImportWorkout[] = parsed.workouts.map(w => ({
      name: w.name || "Workout",
      date: new Date(w.date || today),
      duration: w.duration ?? undefined,
      notes: w.notes ?? undefined,
      exercises: w.exercises.map(e => ({
        name: e.name,
        category: validateCategory(e.category),
        muscleGroups: e.muscleGroups || [],
        sets: e.sets.map(s => ({
          reps: s.reps || 0,
          weight: s.weight ?? undefined,
          duration: s.duration ?? undefined,
          rpe: s.rpe ?? undefined,
          notes: s.notes ?? undefined,
        })),
      })),
    }));

    return buildPreview("freetext", workouts, warnings);
  } catch {
    return buildPreview(
      "freetext",
      [],
      ["Failed to parse AI response as JSON"]
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function buildPreview(
  format: ImportPreview["format"],
  workouts: ImportWorkout[],
  warnings: string[]
): ImportPreview {
  const totalSets = workouts.reduce(
    (sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0),
    0
  );

  let dateRange: ImportPreview["dateRange"] = null;
  if (workouts.length > 0) {
    const dates = workouts.map(w => w.date.getTime()).sort((a, b) => a - b);
    dateRange = {
      earliest: new Date(dates[0]).toISOString().slice(0, 10),
      latest: new Date(dates[dates.length - 1]).toISOString().slice(0, 10),
    };
  }

  return {
    format,
    workouts,
    totalWorkouts: workouts.length,
    totalSets,
    dateRange,
    warnings,
  };
}
