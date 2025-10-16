import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleFormDialog } from "./ModuleFormDialog";
import { LessonFormDialog } from "./LessonFormDialog";

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lesson_count?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  category?: string;
  difficulty?: string;
  duration_hours?: number;
  duration_minutes?: number;
  price?: number;
}

interface CourseContentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

export function CourseContentManager({ open, onOpenChange, courseId, courseTitle }: CourseContentManagerProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedModule, setSelectedModule] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (open && courseId) {
      fetchCourseAndModules();
    }
  }, [open, courseId]);

  const fetchCourseAndModules = async () => {
    setLoading(true);
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules with lesson counts
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      // Get lesson counts for each module
      const modulesWithCounts = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { count } = await supabase
            .from("course_lessons")
            .select("*", { count: "exact", head: true })
            .eq("module_id", module.id);
          
          return { ...module, lesson_count: count || 0 };
        })
      );

      setModules(modulesWithCounts);
    } catch (error: any) {
      toast.error("Failed to fetch course content");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;

    try {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      toast.success("Module deleted successfully");
      fetchCourseAndModules();
    } catch (error: any) {
      toast.error("Failed to delete module");
      console.error(error);
    }
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleDialogOpen(true);
  };

  const handleAddLesson = (module: Module) => {
    setSelectedModule({ id: module.id, title: module.title });
    setLessonDialogOpen(true);
  };

  const handleModuleSuccess = () => {
    fetchCourseAndModules();
  };

  const handleLessonSuccess = () => {
    fetchCourseAndModules();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Manage Course Content</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Course Overview Section */}
              {course && (
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                        <p className="text-muted-foreground mb-4">{course.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {course.category && (
                            <Badge variant="secondary">{course.category}</Badge>
                          )}
                          {course.difficulty && (
                            <Badge variant="outline">{course.difficulty}</Badge>
                          )}
                          {course.price !== undefined && (
                            <Badge>{course.price > 0 ? `$${course.price}` : "Free"}</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Video Player */}
                      {course.video_url && (
                        <div className="rounded-lg overflow-hidden bg-muted">
                          <div className="aspect-video relative">
                            {course.video_url.includes("youtube.com") || course.video_url.includes("youtu.be") ? (
                              <iframe
                                src={course.video_url.replace("watch?v=", "embed/")}
                                className="w-full h-full"
                                allowFullScreen
                                title="Course Preview"
                              />
                            ) : (
                              <video
                                src={course.video_url}
                                controls
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Module Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Course Modules</h3>
                <Button onClick={handleAddModule} size="lg">
                  <Plus className="h-4 w-4 mr-2" /> Add Module
                </Button>
              </div>

              {/* Modules List */}
              <div className="space-y-4">
                {modules.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="mb-4">No modules yet. Create your first module to get started!</p>
                      <Button onClick={handleAddModule} variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Create First Module
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  modules.map((module, index) => (
                    <Card key={module.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="text-lg px-3 py-1">
                                Module {index + 1}
                              </Badge>
                              <h4 className="text-lg font-semibold">{module.title}</h4>
                            </div>
                            {module.description && (
                              <p className="text-muted-foreground mb-3">{module.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <PlayCircle className="h-4 w-4" />
                              <span>{module.lesson_count || 0} lesson{module.lesson_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddLesson(module)}
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Lesson
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditModule(module)}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteModule(module.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ModuleFormDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        courseId={courseId}
        module={editingModule}
        onSuccess={handleModuleSuccess}
        moduleCount={modules.length}
      />

      {selectedModule && (
        <LessonFormDialog
          open={lessonDialogOpen}
          onOpenChange={setLessonDialogOpen}
          moduleId={selectedModule.id}
          moduleName={selectedModule.title}
          onSuccess={handleLessonSuccess}
        />
      )}
    </>
  );
}
