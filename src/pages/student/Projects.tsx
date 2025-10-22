import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Calendar, Upload, CheckCircle, Clock } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { format } from "date-fns";

interface Project {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  courses?: {
    title: string;
  };
  project_submissions?: Array<{
    id: string;
    submission_type: string;
    status: string;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
  }>;
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<"video" | "pdf" | "written">("written");
  const [fileUrl, setFileUrl] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    fetchProjects();
  };

  const fetchProjects = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get enrolled courses
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", session.user.id);

    if (!enrollments || enrollments.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const courseIds = enrollments.map((e) => e.course_id);

    // Get projects for enrolled courses
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        courses (
          title
        ),
        project_submissions!inner (
          id,
          submission_type,
          status,
          submitted_at,
          grade,
          feedback
        )
      `)
      .in("course_id", courseIds)
      .eq("project_submissions.student_id", session.user.id)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      toast.error("Failed to fetch projects");
      console.error(error);
    } else {
      setProjects((data as any) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (submissionType !== "written" && !fileUrl) {
      toast.error("Please provide a file URL");
      return;
    }

    if (submissionType === "written" && !content) {
      toast.error("Please write your submission");
      return;
    }

    const { error } = await supabase.from("project_submissions").insert({
      project_id: selectedProject,
      student_id: session.user.id,
      submission_type: submissionType,
      file_url: submissionType !== "written" ? fileUrl : null,
      content: submissionType === "written" ? content : null,
    } as any);

    if (error) {
      toast.error("Failed to submit project");
      console.error(error);
    } else {
      toast.success("Project submitted successfully");
      setDialogOpen(false);
      setSelectedProject(null);
      setFileUrl("");
      setContent("");
      fetchProjects();
    }
  };

  const openSubmissionDialog = (projectId: string) => {
    setSelectedProject(projectId);
    setDialogOpen(true);
  };

  const getSubmissionStatus = (project: Project) => {
    const submission = project.project_submissions?.[0];
    if (!submission) {
      return { label: "Not Submitted", variant: "secondary" as const, icon: Clock };
    }
    if (submission.grade !== null) {
      return { label: "Graded", variant: "default" as const, icon: CheckCircle };
    }
    return { label: "Submitted", variant: "outline" as const, icon: CheckCircle };
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <div className="flex">
        <StudentSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Projects</h1>

            {loading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center">
                    No projects assigned yet. Projects will appear here once your instructor assigns them.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {projects.map((project) => {
                  const status = getSubmissionStatus(project);
                  const submission = project.project_submissions?.[0];
                  const StatusIcon = status.icon;

                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{project.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {project.courses?.title}
                            </CardDescription>
                          </div>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {project.description && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                          </div>
                        )}

                        {project.due_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {format(new Date(project.due_date), "MMM d, yyyy 'at' h:mm a")}</span>
                          </div>
                        )}

                        {submission && (
                          <div className="border-t pt-4 space-y-2">
                            <p className="text-sm font-medium">Submission Details</p>
                            <p className="text-sm text-muted-foreground">
                              Type: {submission.submission_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {format(new Date(submission.submitted_at), "MMM d, yyyy")}
                            </p>
                            {submission.grade !== null && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  Grade: {submission.grade}/100
                                </p>
                                {submission.feedback && (
                                  <p className="text-sm text-muted-foreground">
                                    Feedback: {submission.feedback}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {!submission && (
                          <Button
                            onClick={() => openSubmissionDialog(project.id)}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Submit Project
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Submission Type</Label>
                    <RadioGroup
                      value={submissionType}
                      onValueChange={(value) =>
                        setSubmissionType(value as "video" | "pdf" | "written")
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="written" id="written" />
                        <Label htmlFor="written">Written Submission</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video" />
                        <Label htmlFor="video">Video URL</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf">PDF URL</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {submissionType === "written" ? (
                    <div>
                      <Label htmlFor="content">Your Submission</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={10}
                        placeholder="Write your project submission here..."
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="fileUrl">
                        {submissionType === "video" ? "Video URL" : "PDF URL"}
                      </Label>
                      <Input
                        id="fileUrl"
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder={`Enter ${submissionType} URL`}
                        required
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    Submit Project
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
