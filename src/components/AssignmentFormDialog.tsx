import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

interface Lesson {
  id: string;
  title: string;
  module_id: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  lesson_id: string;
}

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: Assignment | null;
  onSuccess: () => void;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  onSuccess,
}: AssignmentFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    course_id: "",
    lesson_id: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description || "",
        due_date: assignment.due_date ? assignment.due_date.split("T")[0] : "",
        course_id: assignment.course_id,
        lesson_id: assignment.lesson_id || "",
      });
      if (assignment.course_id) {
        fetchModules(assignment.course_id);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        due_date: "",
        course_id: "",
        lesson_id: "",
      });
      setModules([]);
      setLessons([]);
    }
  }, [assignment, open]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title")
      .eq("status", "published")
      .order("title");

    if (error) {
      console.error("Error fetching courses:", error);
      return;
    }

    setCourses(data || []);
  };

  const fetchModules = async (courseId: string) => {
    const { data, error } = await supabase
      .from("course_modules")
      .select("id, title, course_id")
      .eq("course_id", courseId)
      .order("order_index");

    if (error) {
      console.error("Error fetching modules:", error);
      return;
    }

    setModules(data || []);
  };

  const fetchLessons = async (moduleId: string) => {
    const { data, error } = await supabase
      .from("course_lessons")
      .select("id, title, module_id")
      .eq("module_id", moduleId)
      .order("order_index");

    if (error) {
      console.error("Error fetching lessons:", error);
      return;
    }

    setLessons(data || []);
  };

  const handleCourseChange = (courseId: string) => {
    setFormData({ ...formData, course_id: courseId, lesson_id: "" });
    setModules([]);
    setLessons([]);
    fetchModules(courseId);
  };

  const handleModuleChange = (moduleId: string) => {
    setFormData({ ...formData, lesson_id: "" });
    setLessons([]);
    fetchLessons(moduleId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter assignment title");
      return;
    }

    if (!formData.course_id) {
      toast.error("Please select a course");
      return;
    }

    if (!formData.lesson_id) {
      toast.error("Please select a lesson");
      return;
    }

    setLoading(true);

    try {
      const assignmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        due_date: formData.due_date || null,
        course_id: formData.course_id,
        lesson_id: formData.lesson_id,
      };

      if (assignment) {
        const { error } = await supabase
          .from("assignments")
          .update(assignmentData)
          .eq("id", assignment.id);

        if (error) throw error;
        toast.success("Assignment updated successfully");
      } else {
        const { error } = await supabase
          .from("assignments")
          .insert(assignmentData);

        if (error) throw error;
        toast.success("Assignment created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving assignment:", error);
      toast.error(error.message || "Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? "Edit Assignment" : "Create Assignment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter assignment title"
            />
          </div>

          <div>
            <Label htmlFor="course">Course *</Label>
            <Select
              value={formData.course_id}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {modules.length > 0 && (
            <div>
              <Label htmlFor="module">Module *</Label>
              <Select
                value={
                  lessons.length > 0
                    ? lessons.find((l) => l.id === formData.lesson_id)
                        ?.module_id || ""
                    : ""
                }
                onValueChange={handleModuleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {lessons.length > 0 && (
            <div>
              <Label htmlFor="lesson">Lesson (Video) *</Label>
              <Select
                value={formData.lesson_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, lesson_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter assignment description"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {assignment ? "Update" : "Create"} Assignment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
