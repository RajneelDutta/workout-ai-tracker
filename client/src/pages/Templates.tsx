import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { TemplateEditor } from "@/components/workout/TemplateEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Plus,
  Dumbbell,
  Clock,
  Trash2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Templates() {
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const templatesQuery = trpc.templates.list.useQuery();
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => templatesQuery.refetch(),
  });

  const templates = templatesQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground mt-1">
              Reusable workout blueprints
            </p>
          </div>
          <Button className="gap-2" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        {templatesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                No templates yet. Create one to speed up your workouts.
              </p>
              <Button onClick={() => setEditing("new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card
                key={t.id}
                className="hover:border-border transition-colors cursor-pointer"
                onClick={() => setEditing(t.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    {t.category && (
                      <Badge variant="secondary" className="text-xs">
                        {t.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {t.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3.5 w-3.5" />
                      {t.exerciseCount} exercises
                    </span>
                    {t.estimatedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t.estimatedDuration}m
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={e => {
                        e.stopPropagation();
                        setLocation(`/workout?template=${t.id}`);
                      }}
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={e => {
                        e.stopPropagation();
                        if (
                          confirm(
                            "Delete this template?",
                          )
                        ) {
                          deleteMutation.mutate({ id: t.id });
                          toast.success("Template deleted");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <TemplateEditor
          templateId={editing === "new" ? undefined : editing}
          onClose={() => {
            setEditing(null);
            templatesQuery.refetch();
          }}
        />
      )}
    </DashboardLayout>
  );
}
