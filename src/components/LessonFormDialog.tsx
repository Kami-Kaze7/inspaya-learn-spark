import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  video_duration?: string;
  is_free: boolean;
}

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  lesson?: Lesson | null;
  onSuccess: () => void;
}

export function LessonFormDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  lesson,
  onSuccess,
}: LessonFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || "");
      setVideoUrl(lesson.video_url || "");
      setVideoDuration(lesson.video_duration || "");
      setIsFree(lesson.is_free);
    } else {
      resetForm();
    }
  }, [lesson, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setVideoDuration("");
    setIsFree(false);
  };

  const handleSave = async (saveAndAddAnother: boolean = false) => {
    if (!title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    setLoading(true);
    try {
      if (lesson) {
        // Update existing lesson
        const { error } = await supabase
          .from("course_lessons")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            video_url: videoUrl.trim() || null,
            video_duration: videoDuration.trim() || null,
            is_free: isFree,
          })
          .eq("id", lesson.id);

        if (error) throw error;
        toast.success("Lesson updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        // Create new lesson - get current lesson count
        const { count } = await supabase
          .from("course_lessons")
          .select("*", { count: "exact", head: true })
          .eq("module_id", moduleId);

        const { error } = await supabase
          .from("course_lessons")
          .insert({
            module_id: moduleId,
            title: title.trim(),
            description: description.trim() || null,
            video_url: videoUrl.trim() || null,
            video_duration: videoDuration.trim() || null,
            is_free: isFree,
            order_index: count || 0,
          });

        if (error) throw error;
        toast.success("Lesson created successfully");
        onSuccess();

        if (saveAndAddAnother) {
          resetForm();
        } else {
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      toast.error(`Failed to ${lesson ? "update" : "create"} lesson`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? "Edit Lesson" : `Add Lesson to: ${moduleName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title *</Label>
            <Input
              id="lesson-title"
              placeholder="e.g., Understanding Timeline Basics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-description">Lesson Description (Optional)</Label>
            <Textarea
              id="lesson-description"
              placeholder="Describe what students will learn in this lesson..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL (Optional)</Label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://youtube.com/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-duration">Video Duration (Optional)</Label>
              <Input
                id="video-duration"
                placeholder="e.g., 10:30"
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="space-y-2">
              <Label>Video Preview</Label>
              <div className="rounded-lg overflow-hidden bg-muted border">
                <div className="aspect-video relative">
                  {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                      className="w-full h-full absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Lesson Video Preview"
                    />
                  ) : (
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full absolute inset-0 object-contain bg-black"
                      title="Lesson Video Preview"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-free"
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked as boolean)}
            />
            <Label
              htmlFor="is-free"
              className="text-sm font-normal cursor-pointer"
            >
              Make this lesson available as a free preview
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {!lesson && (
            <Button
              variant="secondary"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              Save & Add Another
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={loading}>
            {loading ? "Saving..." : lesson ? "Update Lesson" : "Save Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
