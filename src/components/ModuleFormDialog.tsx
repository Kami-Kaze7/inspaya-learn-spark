import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description?: string;
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

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [module, open]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{module ? "Edit Module" : "Add New Module"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
  );
}
