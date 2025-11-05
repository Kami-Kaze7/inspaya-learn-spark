import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import { format } from "date-fns";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ course_id: "", title: "", description: "", due_date: "" });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (loading === false) {
      const channel = supabase
        .channel('project-submissions-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_submissions'
          },
          () => {
            // Refetch projects when submissions change
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) fetchProjects(session.user.id);
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loading]);

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

    fetchProjects(session.user.id);
    fetchCourses(session.user.id);
  };

  const fetchProjects = async (userId: string) => {
    const { data: courses } = await supabase.from("courses").select("id").eq("instructor_id", userId);
    const courseIds = courses?.map(c => c.id) || [];

    const { data, error } = await supabase
      .from("projects")
      .select(`*, courses(title)`)
      .in("course_id", courseIds)
      .order("created_at", { ascending: false });

    if (!error) setProjects(data || []);
    setLoading(false);
  };

  const fetchCourses = async (userId: string) => {
    const { data } = await supabase.from("courses").select("id, title").eq("instructor_id", userId).eq("status", "published");
    setCourses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("projects").insert({
      course_id: formData.course_id,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
    });

    if (error) {
      toast.error("Failed to create project");
    } else {
      toast.success("Project created successfully");
      setDialogOpen(false);
      setFormData({ course_id: "", title: "", description: "", due_date: "" });
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchProjects(session.user.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      toast.success("Project deleted");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchProjects(session.user.id);
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
              <h1 className="text-2xl font-bold">Projects</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Create Project</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Course *</Label>
                    <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Project Title *</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="datetime-local" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Create Project</Button>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          <main className="flex-1 p-6">
            <Card>
              <CardHeader><CardTitle>All Projects</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p>Loading...</p> : projects.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No projects yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.courses?.title || "N/A"}</TableCell>
                          <TableCell>
                            {project.due_date ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(project.due_date), "MMM d, yyyy")}
                              </div>
                            ) : "No due date"}
                          </TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
