import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, List, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CourseFormDialog } from "@/components/CourseFormDialog";
import { CourseContentManager } from "@/components/CourseContentManager";

interface Course {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  status: string;
  created_at: string;
  category?: string;
  difficulty?: string;
  language?: string;
  price?: number;
  duration_hours?: number;
  duration_minutes?: number;
  video_url?: string;
  thumbnail_url?: string;
}

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "instructor")
      .maybeSingle();

    if (!roles) {
      toast.error("Access denied. Instructor privileges required.");
      navigate("/student");
      return;
    }

    setCurrentUserId(session.user.id);
    fetchCourses(session.user.id);
  };

  const fetchCourses = async (userId: string) => {
    try {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(coursesData || []);
    } catch (error: any) {
      toast.error("Failed to fetch courses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      toast.success("Course deleted successfully");
      if (currentUserId) fetchCourses(currentUserId);
    } catch (error: any) {
      toast.error("Failed to delete course");
      console.error(error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">My Courses</h1>
            </div>
            <Button onClick={() => {
              setEditingCourse(null);
              setDialogOpen(true);
            }}>+ Create New Course</Button>
          </header>

          <main className="flex-1 p-6">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>THUMBNAIL</TableHead>
                    <TableHead>COURSE DETAILS</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>PRICE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No courses found. Create your first course!
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          {course.thumbnail_url ? (
                            <div className="relative w-16 h-16 rounded overflow-hidden">
                              <img 
                                src={course.thumbnail_url} 
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.short_description || course.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{course.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          {course.price ? `$${course.price.toFixed(2)}` : "Free"}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            course.status === "published" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {course.video_url && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => window.open(course.video_url, '_blank')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingCourse(course);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedCourse({ id: course.id, title: course.title });
                                setLessonDialogOpen(true);
                              }}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(course.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>

      <CourseFormDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCourse(null);
        }}
        onSuccess={() => currentUserId && fetchCourses(currentUserId)}
        course={editingCourse}
      />

      {selectedCourse && (
        <CourseContentManager
          open={lessonDialogOpen}
          onOpenChange={setLessonDialogOpen}
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
        />
      )}
    </SidebarProvider>
  );
}
