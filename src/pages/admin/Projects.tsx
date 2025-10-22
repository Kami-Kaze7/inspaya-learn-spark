import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { format } from "date-fns";

interface Project {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  courses?: {
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    due_date: "",
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

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      navigate("/");
      return;
    }

    fetchProjects();
    fetchCourses();
  };

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        courses (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch projects");
      console.error(error);
    } else {
      setProjects((data as any) || []);
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title")
      .eq("status", "published")
      .order("title");

    if (error) {
      toast.error("Failed to fetch courses");
      console.error(error);
    } else {
      setCourses(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.course_id || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("projects").insert({
      course_id: formData.course_id,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
    } as any);

    if (error) {
      toast.error("Failed to create project");
      console.error(error);
    } else {
      toast.success("Project created successfully");
      setDialogOpen(false);
      setFormData({ course_id: "", title: "", description: "", due_date: "" });
      fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete project");
      console.error(error);
    } else {
      toast.success("Project deleted successfully");
      fetchProjects();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <SidebarTrigger className="mb-4" />
          
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Projects</h1>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="course">Course *</Label>
                      <Select
                        value={formData.course_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, course_id: value })
                        }
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

                    <div>
                      <Label htmlFor="title">Project Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={(e) =>
                          setFormData({ ...formData, due_date: e.target.value })
                        }
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Create Project
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No projects created yet. Create your first project!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.title}
                          </TableCell>
                          <TableCell>
                            {project.courses?.title || "N/A"}
                          </TableCell>
                          <TableCell>
                            {project.due_date ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(project.due_date), "MMM d, yyyy")}
                              </div>
                            ) : (
                              "No due date"
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(project.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(project.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
