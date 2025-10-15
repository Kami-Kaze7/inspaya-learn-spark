import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, List, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CourseFormDialog } from "@/components/CourseFormDialog";

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    enrollments: 0,
  });

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
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/student");
      return;
    }

    fetchCourses();
  };

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(coursesData || []);
      
      const published = coursesData?.filter(c => c.status === "published").length || 0;
      const drafts = coursesData?.filter(c => c.status === "draft").length || 0;
      
      // Get enrollments count
      const { count: enrollmentCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true });

      setStats({
        total: coursesData?.length || 0,
        published,
        drafts,
        enrollments: enrollmentCount || 0,
      });
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
      fetchCourses();
    } catch (error: any) {
      toast.error("Failed to delete course");
      console.error(error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Course Management</h1>
            </div>
            <Button onClick={() => setDialogOpen(true)}>+ Create New Course</Button>
          </header>

          <main className="flex-1 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground mt-2">TOTAL COURSES</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold">{stats.published}</div>
                  <div className="text-sm text-muted-foreground mt-2">PUBLISHED</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold">{stats.drafts}</div>
                  <div className="text-sm text-muted-foreground mt-2">DRAFTS</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold">{stats.enrollments}</div>
                  <div className="text-sm text-muted-foreground mt-2">ENROLLMENTS</div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>THUMBNAIL</TableHead>
                    <TableHead>COURSE DETAILS</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>PRICE</TableHead>
                    <TableHead>DURATION</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No courses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-blue-600">{course.title}</div>
                          <div className="text-sm text-muted-foreground">{course.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">General</Badge>
                        </TableCell>
                        <TableCell>$99.00</TableCell>
                        <TableCell>8h 45m</TableCell>
                        <TableCell>
                          <Badge variant={course.status === "published" ? "default" : "secondary"}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
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
        onOpenChange={setDialogOpen}
        onSuccess={fetchCourses}
      />
    </SidebarProvider>
  );
}
