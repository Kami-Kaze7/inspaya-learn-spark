import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  video_url?: string;
  video_duration?: string;
  order_index: number;
  is_free: boolean;
}

interface LessonManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

export function LessonManagementDialog({ open, onOpenChange, courseId, courseTitle }: LessonManagementDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && courseId) {
      fetchModulesAndLessons();
    }
  }, [open, courseId]);

  const fetchModulesAndLessons = async () => {
    setLoading(true);
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", modulesData?.map(m => m.id) || [])
        .order("order_index", { ascending: true });

      if (lessonsError) throw lessonsError;

      const modulesWithLessons = modulesData?.map(module => ({
        ...module,
        lessons: lessonsData?.filter(l => l.module_id === module.id) || []
      })) || [];

      setModules(modulesWithLessons);
    } catch (error: any) {
      toast.error("Failed to fetch modules and lessons");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addModule = async () => {
    try {
      const { data, error } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseId,
          title: "New Module",
          order_index: modules.length
        })
        .select()
        .single();

      if (error) throw error;

      setModules([...modules, { ...data, lessons: [] }]);
      setExpandedModules(new Set([...expandedModules, data.id]));
      toast.success("Module added");
    } catch (error: any) {
      toast.error("Failed to add module");
      console.error(error);
    }
  };

  const updateModule = async (moduleId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("course_modules")
        .update({ [field]: value })
        .eq("id", moduleId);

      if (error) throw error;

      setModules(modules.map(m => 
        m.id === moduleId ? { ...m, [field]: value } : m
      ));
    } catch (error: any) {
      toast.error("Failed to update module");
      console.error(error);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;

    try {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== moduleId));
      toast.success("Module deleted");
    } catch (error: any) {
      toast.error("Failed to delete module");
      console.error(error);
    }
  };

  const addLesson = async (moduleId: string) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      const { data, error } = await supabase
        .from("course_lessons")
        .insert({
          module_id: moduleId,
          title: "New Lesson",
          order_index: module?.lessons.length || 0,
          is_free: false
        })
        .select()
        .single();

      if (error) throw error;

      setModules(modules.map(m => 
        m.id === moduleId 
          ? { ...m, lessons: [...m.lessons, data] }
          : m
      ));
      toast.success("Lesson added");
    } catch (error: any) {
      toast.error("Failed to add lesson");
      console.error(error);
    }
  };

  const updateLesson = async (lessonId: string, moduleId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("course_lessons")
        .update({ [field]: value })
        .eq("id", lessonId);

      if (error) throw error;

      setModules(modules.map(m => 
        m.id === moduleId 
          ? { 
              ...m, 
              lessons: m.lessons.map(l => 
                l.id === lessonId ? { ...l, [field]: value } : l
              )
            }
          : m
      ));
    } catch (error: any) {
      toast.error("Failed to update lesson");
      console.error(error);
    }
  };

  const deleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm("Delete this lesson?")) return;

    try {
      const { error } = await supabase
        .from("course_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      setModules(modules.map(m => 
        m.id === moduleId 
          ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
          : m
      ));
      toast.success("Lesson deleted");
    } catch (error: any) {
      toast.error("Failed to delete lesson");
      console.error(error);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Course Content: {courseTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={addModule} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Module
          </Button>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <Collapsible
                  key={module.id}
                  open={expandedModules.has(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedModules.has(module.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(module.id, "title", e.target.value)}
                            className="font-semibold"
                            placeholder="Module Title"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteModule(module.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          value={module.description || ""}
                          onChange={(e) => updateModule(module.id, "description", e.target.value)}
                          placeholder="Module Description (optional)"
                          rows={2}
                        />

                        <CollapsibleContent>
                          <div className="mt-4 space-y-3 pl-6 border-l-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(module.id)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Lesson
                            </Button>

                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="border rounded p-3 bg-background space-y-2">
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-2" />
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      value={lesson.title}
                                      onChange={(e) => updateLesson(lesson.id, module.id, "title", e.target.value)}
                                      placeholder="Lesson Title"
                                    />
                                    <Textarea
                                      value={lesson.description || ""}
                                      onChange={(e) => updateLesson(lesson.id, module.id, "description", e.target.value)}
                                      placeholder="Lesson Description (optional)"
                                      rows={2}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">Video URL</Label>
                                        <Input
                                          value={lesson.video_url || ""}
                                          onChange={(e) => updateLesson(lesson.id, module.id, "video_url", e.target.value)}
                                          placeholder="https://..."
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Duration</Label>
                                        <Input
                                          value={lesson.video_duration || ""}
                                          onChange={(e) => updateLesson(lesson.id, module.id, "video_duration", e.target.value)}
                                          placeholder="e.g., 10:30"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={lesson.is_free}
                                        onChange={(e) => updateLesson(lesson.id, module.id, "is_free", e.target.checked)}
                                        className="rounded"
                                      />
                                      <Label className="text-xs">Free Preview</Label>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteLesson(lesson.id, module.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </div>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
