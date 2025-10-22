import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Play, Edit, Trash2 } from "lucide-react";
import { LessonFormDialog } from "@/components/LessonFormDialog";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  video_duration?: string;
  is_free: boolean;
  order_index: number;
}

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  module: Module | null;
  onSuccess: () => void;
  moduleCount: number;
}

export function ModuleFormDialog({
  open,
  onOpenChange,
  courseId,
  module,
  onSuccess,
  moduleCount,
}: ModuleFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || "");
      fetchLessons(module.id);
    } else {
      setTitle("");
      setDescription("");
      setLessons([]);
    }
    setPlayingVideo(null);
  }, [module, open]);

  const fetchLessons = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast.error("Failed to fetch lessons");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const { error } = await supabase
        .from("course_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;
      toast.success("Lesson deleted successfully");
      if (module) fetchLessons(module.id);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleLessonSuccess = () => {
    if (module) fetchLessons(module.id);
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Module title is required");
      return;
    }

    setLoading(true);
    try {
      if (module) {
        // Update existing module
        const { error } = await supabase
          .from("course_modules")
          .update({
            title: title.trim(),
            description: description.trim() || null,
          })
          .eq("id", module.id);

        if (error) throw error;
        toast.success("Module updated successfully");
      } else {
        // Create new module
        const { error } = await supabase
          .from("course_modules")
          .insert({
            course_id: courseId,
            title: title.trim(),
            description: description.trim() || null,
            order_index: moduleCount,
          });

        if (error) throw error;
        toast.success("Module created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to ${module ? "update" : "create"} module`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{module ? "Edit Module" : "Add New Module"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="module-title">Module Title *</Label>
                <Input
                  id="module-title"
                  placeholder="e.g., Introduction to Video Editing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-description">Module Description (Optional)</Label>
                <Textarea
                  id="module-description"
                  placeholder="Describe what students will learn in this module..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {module && lessons.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Lessons in this Module</h3>
                  <Badge variant="secondary">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</Badge>
                </div>

                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <Card key={lesson.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{lesson.title}</h4>
                              {lesson.is_free && (
                                <Badge variant="outline" className="text-xs">Free</Badge>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
                            )}
                            {lesson.video_duration && (
                              <p className="text-xs text-muted-foreground mt-1">Duration: {lesson.video_duration}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.video_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPlayingVideo(playingVideo === lesson.id ? null : lesson.id)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLesson(lesson)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {playingVideo === lesson.id && lesson.video_url && (
                          <div className="rounded-lg overflow-hidden border">
                            <iframe
                              src={getVideoEmbedUrl(lesson.video_url)}
                              className="w-full aspect-video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : module ? "Update Module" : "Create Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {module && (
        <LessonFormDialog
          open={lessonDialogOpen}
          onOpenChange={setLessonDialogOpen}
          moduleId={module.id}
          moduleName={module.title}
          lesson={selectedLesson}
          onSuccess={handleLessonSuccess}
        />
      )}
    </>
  );
}
