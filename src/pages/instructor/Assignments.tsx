import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AssignmentFormDialog } from "@/components/AssignmentFormDialog";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  course_id: string;
  lesson_id: string;
  courses: { title: string };
  course_lessons: { title: string };
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  grade: number | null;
  status: string;
  feedback: string | null;
  content: string | null;
  file_url: string | null;
  profiles: { full_name: string; email: string };
}

export default function Assignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

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

    fetchAssignments(session.user.id);
  };

  const fetchAssignments = async (userId: string) => {
    try {
      // Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", userId);

      const courseIds = courses?.map(c => c.id) || [];

      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          courses(title),
          course_lessons(title)
        `)
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAssignments(data || []);
      
      // Fetch submissions
      const assignmentIds = data?.map(a => a.id) || [];
      if (assignmentIds.length > 0) {
        const { data: submissionsData } = await supabase
          .from("assignment_submissions")
          .select("*")
          .in("assignment_id", assignmentIds)
          .order("submitted_at", { ascending: false });

        // Fetch profiles
        const studentIds = [...new Set(submissionsData?.map(s => s.student_id) || [])];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds);

        const submissionsWithProfiles = submissionsData?.map(submission => ({
          ...submission,
          profiles: profilesData?.find(p => p.id === submission.student_id) || { full_name: "Unknown", email: "N/A" }
        })) || [];

        setSubmissions(submissionsWithProfiles as Submission[]);
      }
    } catch (error: any) {
      toast.error("Failed to fetch assignments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAssignment(null);
    setDialogOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDialogOpen(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Assignment deleted successfully");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchAssignments(session.user.id);
    } catch (error: any) {
      toast.error("Failed to delete assignment");
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
              <h1 className="text-2xl font-bold">Assignments Management</h1>
            </div>
            <Button onClick={handleCreate}>+ Create Assignment</Button>
          </header>

          <main className="flex-1 p-6">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No assignments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assignment) => {
                      const assignmentSubmissions = submissions.filter(
                        (sub) => sub.assignment_id === assignment.id
                      );
                      const isExpanded = expandedAssignment === assignment.id;

                      return (
                        <>
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.title}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{assignment.courses?.title || "N/A"}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {assignment.course_lessons?.title || "N/A"}
                            </TableCell>
                            <TableCell>
                              {assignment.due_date ? format(new Date(assignment.due_date), "MMM dd, yyyy") : "No due date"}
                            </TableCell>
                            <TableCell>
                              {format(new Date(assignment.created_at), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {assignmentSubmissions.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {assignmentSubmissions.length}
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleEdit(assignment)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(assignment.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && assignmentSubmissions.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/50">
                                <div className="p-4 space-y-3">
                                  <h4 className="font-semibold">Submissions</h4>
                                  {assignmentSubmissions.map((submission) => (
                                    <div key={submission.id} className="border rounded-lg p-3 bg-background">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="font-medium">{submission.profiles?.full_name}</p>
                                          <p className="text-sm text-muted-foreground">{submission.profiles?.email}</p>
                                        </div>
                                        <Badge variant={submission.grade ? "default" : "secondary"}>
                                          {submission.grade ? `Grade: ${submission.grade}` : submission.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        Submitted: {format(new Date(submission.submitted_at), "MMM dd, yyyy HH:mm")}
                                      </p>
                                      {submission.content && (
                                        <p className="text-sm mb-2">{submission.content}</p>
                                      )}
                                      {submission.file_url && (
                                        <a 
                                          href={submission.file_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline"
                                        >
                                          View Attachment
                                        </a>
                                      )}
                                      {submission.feedback && (
                                        <div className="mt-2 pt-2 border-t">
                                          <p className="text-sm font-medium">Feedback:</p>
                                          <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>

      <AssignmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={selectedAssignment}
        onSuccess={() => {
          const userId = supabase.auth.getUser().then(({ data }) => {
            if (data.user) fetchAssignments(data.user.id);
          });
        }}
      />
    </SidebarProvider>
  );
}
