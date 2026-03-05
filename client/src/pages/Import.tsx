import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Upload,
  FileSpreadsheet,
  MessageSquareText,
  Database,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Format = "strive" | "csv" | "freetext";
type Step = "format" | "input" | "preview" | "done";

interface PreviewData {
  format: Format;
  totalWorkouts: number;
  totalSets: number;
  dateRange: { earliest: string; latest: string } | null;
  warnings: string[];
  workouts: Array<{
    name: string;
    date: string;
    duration?: number;
    notes?: string;
    exercises: Array<{
      name: string;
      category: string;
      muscleGroups: string[];
      sets: Array<{
        reps: number;
        weight?: number;
        duration?: number;
        rpe?: number;
        notes?: string;
      }>;
    }>;
  }>;
}

const CSV_TEMPLATE = `date,workout_name,exercise_name,category,reps,weight_kg,duration_sec,rpe,notes
2026-03-01,Push Day,Bench Press,strength,8,80,,,
2026-03-01,Push Day,Bench Press,strength,8,80,,,
2026-03-01,Push Day,Bench Press,strength,6,85,,,Hard set
2026-03-01,Push Day,Overhead Press,strength,10,40,,,
2026-03-01,Push Day,Overhead Press,strength,10,40,,,
`;

export default function Import() {
  const [step, setStep] = useState<Step>("format");
  const [format, setFormat] = useState<Format | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<{
    totalWorkouts: number;
    totalSets: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const previewMutation = trpc.import.preview.useMutation({
    onSuccess: data => {
      try {
        const serialized: PreviewData = {
          format: data.format,
          totalWorkouts: data.totalWorkouts,
          totalSets: data.totalSets,
          dateRange: data.dateRange,
          warnings: data.warnings,
          workouts: data.workouts.map(w => ({
            name: w.name,
            date: new Date(w.date).toISOString(),
            duration: w.duration ?? undefined,
            notes: w.notes ?? undefined,
            exercises: w.exercises.map(e => ({
              name: e.name,
              category: e.category,
              muscleGroups: e.muscleGroups,
              sets: e.sets.map(s => ({
                reps: s.reps,
                weight: s.weight ?? undefined,
                duration: s.duration ?? undefined,
                rpe: s.rpe ?? undefined,
                notes: s.notes ?? undefined,
              })),
            })),
          })),
        };
        setPreview(serialized);
        setStep("preview");
      } catch (err) {
        console.error("[Import] Failed to process preview:", err);
        toast.error("Failed to process preview data");
      }
    },
    onError: err => {
      toast.error(err.message);
    },
  });

  const commitMutation = trpc.import.commit.useMutation({
    onSuccess: data => {
      setImportResult(data);
      setStep("done");
      toast.success(
        `Imported ${data.totalWorkouts} workouts with ${data.totalSets} sets`
      );
    },
    onError: err => {
      toast.error(err.message);
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      const reader = new FileReader();

      if (format === "strive") {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setFileData(base64);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          setFileData(reader.result as string);
        };
        reader.readAsText(file);
      }
    },
    [format]
  );

  const canPreview =
    format === "freetext"
      ? textInput.trim().length > 0
      : format === "csv"
        ? !!fileData || textInput.trim().length > 0
        : !!fileData;

  const handlePreview = () => {
    if (format === "freetext") {
      if (!textInput.trim()) {
        toast.error("Please enter some workout data");
        return;
      }
      previewMutation.mutate({ format: "freetext", data: textInput });
    } else if (format === "csv" && !fileData && textInput.trim()) {
      previewMutation.mutate({ format: "csv", data: textInput });
    } else if (fileData) {
      previewMutation.mutate({ format: format!, data: fileData });
    } else {
      toast.error("Please select a file first");
    }
  };

  const handleCommit = () => {
    if (!preview) return;
    commitMutation.mutate({
      workouts: preview.workouts.map(w => ({
        ...w,
        exercises: w.exercises.map(e => ({
          ...e,
          category: e.category as
            | "strength"
            | "cardio"
            | "flexibility"
            | "sports"
            | "other",
        })),
      })),
    });
  };

  const downloadCSVTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workout-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep("format");
    setFormat(null);
    setTextInput("");
    setFileData(null);
    setFileName(null);
    setPreview(null);
    setImportResult(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          {step !== "format" && step !== "done" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (step === "preview") setStep("input");
                else if (step === "input") {
                  setStep("format");
                  setFormat(null);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-3xl font-bold">Import Workouts</h1>
        </div>

        {/* Step 1: Format selection */}
        {step === "format" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <FormatCard
              icon={<Database className="h-8 w-8" />}
              title="Strive Backup"
              description="Import from a Strive .db backup file"
              onClick={() => {
                setFormat("strive");
                setStep("input");
              }}
            />
            <FormatCard
              icon={<FileSpreadsheet className="h-8 w-8" />}
              title="CSV File"
              description="Import from a CSV spreadsheet"
              onClick={() => {
                setFormat("csv");
                setStep("input");
              }}
            />
            <FormatCard
              icon={<MessageSquareText className="h-8 w-8" />}
              title="Free Text"
              description="Describe workouts in plain English"
              onClick={() => {
                setFormat("freetext");
                setStep("input");
              }}
            />
          </div>
        )}

        {/* Step 2: Input */}
        {step === "input" && format && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format === "strive" && "Upload Strive Backup"}
                {format === "csv" && "Upload CSV File"}
                {format === "freetext" && "Describe Your Workouts"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(format === "strive" || format === "csv") && (
                <>
                  <label className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {fileName ? (
                      <p className="font-medium">{fileName}</p>
                    ) : (
                      <p className="text-muted-foreground">
                        {format === "strive"
                          ? "Tap to choose your .db backup file"
                          : "Tap to choose your .csv file"}
                      </p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={format === "strive" ? "*/*" : ".csv,.txt,text/*"}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {fileName ? "Choose Different File" : "Choose File"}
                  </Button>
                </>
              )}

              {format === "csv" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">
                      or paste CSV text
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Textarea
                    placeholder="date,workout_name,exercise_name,category,reps,weight_kg,duration_sec,rpe,notes"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCSVTemplate}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download CSV Template
                  </Button>
                </>
              )}

              {format === "freetext" && (
                <>
                  <Textarea
                    placeholder={`Example:\nDid 3x8 bench press at 80kg yesterday\nThen 3x10 overhead press at 40kg\nFinished with 3x12 lateral raises at 10kg`}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI will extract exercises, sets, reps, and weights from your
                    description. Weights are assumed to be in kg unless you
                    specify lbs.
                  </p>
                </>
              )}

              <Button
                onClick={handlePreview}
                disabled={previewMutation.isPending || !canPreview}
                className="w-full"
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {format === "freetext" ? "Analyzing..." : "Parsing..."}
                  </>
                ) : (
                  "Preview Import"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && preview && (
          <div className="space-y-4">
            {/* Summary card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">
                      {preview.totalWorkouts}
                    </p>
                    <p className="text-sm text-muted-foreground">Workouts</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{preview.totalSets}</p>
                    <p className="text-sm text-muted-foreground">Total Sets</p>
                  </div>
                </div>
                {preview.dateRange && (
                  <p className="text-sm text-center text-muted-foreground mt-3">
                    {preview.dateRange.earliest} — {preview.dateRange.latest}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {preview.warnings.slice(0, 10).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {preview.warnings.length > 10 && (
                      <li>
                        ...and {preview.warnings.length - 10} more warnings
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Workout list (collapsed) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workouts to Import</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {preview.workouts.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.date).toLocaleDateString()} —{" "}
                          {w.exercises.length} exercise
                          {w.exercises.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {w.exercises.slice(0, 3).map((e, j) => (
                          <Badge
                            key={j}
                            variant="secondary"
                            className="text-xs"
                          >
                            {e.name}
                          </Badge>
                        ))}
                        {w.exercises.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{w.exercises.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleCommit}
              disabled={commitMutation.isPending || preview.totalWorkouts === 0}
              className="w-full"
              size="lg"
            >
              {commitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${preview.totalWorkouts} Workout${preview.totalWorkouts !== 1 ? "s" : ""}`
              )}
            </Button>

            {commitMutation.isPending && (
              <Progress value={undefined} className="animate-pulse" />
            )}
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && importResult && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <p className="text-2xl font-bold">Import Complete</p>
                <p className="text-muted-foreground">
                  {importResult.totalWorkouts} workouts and{" "}
                  {importResult.totalSets} sets imported successfully
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={reset}>
                  Import More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function FormatCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="pt-6 text-center space-y-2">
        <div className="mx-auto text-primary">{icon}</div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
