import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper function to encode URL properly (spaces and special chars)
const encodeVideoUrl = (url: string): string => {
  if (!url) return url;
  
  // Simply replace spaces with %20 - don't over-engineer it
  return url.replace(/ /g, '%20');
};

export function CourseFormDialog({ open, onOpenChange, onSuccess }: CourseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    category: "",
    difficulty: "",
    language: "English",
    price: "",
    durationHours: "",
    durationMinutes: "",
    tags: "",
    requirements: "",
    whatYouLearn: "",
    videoUrl: "",
    videoDuration: "",
  });

  const handleSubmit = async (status: "draft" | "published") => {
    if (!formData.title || !formData.shortDescription) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Encode video URL only when saving
      const encodedVideoUrl = formData.videoUrl ? encodeVideoUrl(formData.videoUrl) : null;
      
      const { error } = await supabase.from("courses").insert({
        title: formData.title,
        description: formData.fullDescription || formData.shortDescription,
        short_description: formData.shortDescription,
        status: status,
        instructor_id: session?.user.id,
        category: formData.category,
        difficulty: formData.difficulty,
        language: formData.language,
        price: formData.price ? parseFloat(formData.price) : null,
        duration_hours: formData.durationHours ? parseInt(formData.durationHours) : null,
        duration_minutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        tags: formData.tags,
        requirements: formData.requirements,
        what_you_learn: formData.whatYouLearn,
        video_url: encodedVideoUrl,
        video_duration: formData.videoDuration,
      });

      if (error) throw error;

      toast.success(`Course ${status === "draft" ? "saved as draft" : "published"} successfully`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Failed to create course");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      fullDescription: "",
      category: "",
      difficulty: "",
      language: "English",
      price: "",
      durationHours: "",
      durationMinutes: "",
      tags: "",
      requirements: "",
      whatYouLearn: "",
      videoUrl: "",
      videoDuration: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create/Edit Course</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Input
                  id="shortDesc"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullDesc">Full Description</Label>
            <Textarea
              id="fullDesc"
              rows={4}
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-courses">AI Courses</SelectItem>
                  <SelectItem value="motion-graphics">Motion Graphics</SelectItem>
                  <SelectItem value="video-editing">Video Editing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Beginner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationHours">Duration (Hours)</Label>
              <Input
                id="durationHours"
                type="number"
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (Minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatYouLearn">What You'll Learn</Label>
            <Textarea
              id="whatYouLearn"
              rows={3}
              value={formData.whatYouLearn}
              onChange={(e) => setFormData({ ...formData, whatYouLearn: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                placeholder="Paste your Wasabi video URL here"
                value={formData.videoUrl}
                onChange={(e) => {
                  setFormData({ ...formData, videoUrl: e.target.value });
                  setVideoError(false);
                  setVideoLoading(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                🔗 Paste a direct video link from your Wasabi storage (spaces will be auto-encoded on save)
              </p>
            </div>

            {formData.videoUrl && (
              <div className="space-y-2">
                <Label>Video Preview</Label>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  {videoLoading && !videoError && (
                    <div className="aspect-video flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Loading video...</p>
                    </div>
                  )}
                  {videoError && (
                    <div className="aspect-video flex items-center justify-center">
                      <p className="text-sm text-destructive">Unable to load video. Please check the URL.</p>
                    </div>
                  )}
                  <video
                    key={formData.videoUrl}
                    controls
                    className={`w-full ${videoLoading || videoError ? 'hidden' : ''}`}
                    onLoadedMetadata={() => setVideoLoading(false)}
                    onError={() => {
                      setVideoError(true);
                      setVideoLoading(false);
                    }}
                  >
                    <source src={encodeVideoUrl(formData.videoUrl)} type="video/mp4" />
                    <source src={encodeVideoUrl(formData.videoUrl)} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="videoDuration">Video Duration</Label>
              <Input
                id="videoDuration"
                placeholder="e.g. 1:30:00"
                value={formData.videoDuration}
                onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit("published")} disabled={loading} className="bg-green-600 hover:bg-green-700">
              Publish Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
