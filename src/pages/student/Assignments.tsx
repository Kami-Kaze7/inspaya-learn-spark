import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText, Calendar, Book, CheckCircle2, Clock, Upload } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  lesson_id: string;
  courses: {
    title: string;
  };
  course_lessons: {
    title: string;
  };
}

interface Submission {
  id: string;
  assignment_id: string;
  content: string;
  status: string;
  submitted_at: string;
  grade: number;
  feedback: string;
}

const Assignments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = searchParams.get("lesson");
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [lessonId]);

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      // Get user's enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map((e) => e.course_id);

      // Fetch assignments for enrolled courses
      let query = supabase
        .from("assignments")
        .select(`
          *,
          courses(title),
          course_lessons(title)
        `)
        .in("course_id", courseIds)
        .order("due_date", { ascending: true });

      // Filter by lesson if specified
      if (lessonId) {
        query = query.eq("lesson_id", lessonId);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;

      if (assignmentsError) throw assignmentsError;

      setAssignments(assignmentsData || []);

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_id", user.id);

      if (submissionsData) {
        const submissionsMap: Record<string, Submission> = {};
        submissionsData.forEach((sub: any) => {
          submissionsMap[sub.assignment_id] = sub;
        });
        setSubmissions(submissionsMap);
      }

      // Auto-select assignment if coming from lesson
      if (lessonId && assignmentsData && assignmentsData.length > 0) {
        setSelectedAssignment(assignmentsData[0]);
        const existingSubmission = submissionsData?.find(
          (s: any) => s.assignment_id === assignmentsData[0].id
        );
        if (existingSubmission) {
          setSubmissionContent(existingSubmission.content || "");
        }
      }
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSubmitting(true);

    try {
      const submission = submissions[selectedAssignment.id];

      if (submission) {
        // Update existing submission
        const { error } = await supabase
          .from("assignment_submissions")
          .update({
            content: submissionContent,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", submission.id);

        if (error) throw error;
        toast.success("Submission updated successfully");
      } else {
        // Create new submission
        const { error } = await supabase
          .from("assignment_submissions")
          .insert({
            assignment_id: selectedAssignment.id,
            student_id: user.id,
            content: submissionContent,
            status: "submitted",
          });

        if (error) throw error;
        toast.success("Assignment submitted successfully");
      }

      fetchAssignments();
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      toast.error(error.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentSelect = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const submission = submissions[assignment.id];
    setSubmissionContent(submission?.content || "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentHeader />
        <StudentSidebar />
        <main className="ml-64 mt-[73px] p-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            View and submit assignments for your enrolled courses
          </p>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-lg font-semibold">No assignments found</p>
              <p className="text-sm text-muted-foreground">
                Assignments will appear here when your instructors create them
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Assignments List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Your Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {assignments.map((assignment) => {
                    const submission = submissions[assignment.id];
                    const isOverdue =
                      assignment.due_date &&
                      new Date(assignment.due_date) < new Date() &&
                      !submission;

                    return (
                      <button
                        key={assignment.id}
                        onClick={() => handleAssignmentSelect(assignment)}
                        className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                          selectedAssignment?.id === assignment.id
                            ? "bg-accent border-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{assignment.title}</h3>
                          {submission ? (
                            submission.status === "graded" ? (
                              <Badge variant="default">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Graded
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Submitted
                              </Badge>
                            )
                          ) : isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Book className="h-3 w-3" />
                            {assignment.courses.title}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {assignment.course_lessons.title}
                          </div>
                          {assignment.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {format(new Date(assignment.due_date), "MMM dd, yyyy")}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Assignment Details & Submission */}
            <div className="lg:col-span-2">
              {selectedAssignment ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="mb-2">{selectedAssignment.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{selectedAssignment.courses.title}</Badge>
                          <Badge variant="outline">{selectedAssignment.course_lessons.title}</Badge>
                        </div>
                      </div>
                      {submissions[selectedAssignment.id]?.status === "graded" && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Grade</p>
                          <p className="text-2xl font-bold text-primary">
                            {submissions[selectedAssignment.id].grade}%
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {selectedAssignment.description || "No description provided"}
                      </p>
                      {selectedAssignment.due_date && (
                        <div className="mt-4 flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Due: {format(new Date(selectedAssignment.due_date), "MMMM dd, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      )}
                    </div>

                    {submissions[selectedAssignment.id]?.feedback && (
                      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                        <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                          Instructor Feedback
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                          {submissions[selectedAssignment.id].feedback}
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="submission">Your Submission</Label>
                        <Textarea
                          id="submission"
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          placeholder="Type your submission here..."
                          className="min-h-[200px]"
                          disabled={submissions[selectedAssignment.id]?.status === "graded"}
                        />
                      </div>

                      {submissions[selectedAssignment.id] && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          Last submitted:{" "}
                          {format(
                            new Date(submissions[selectedAssignment.id].submitted_at),
                            "MMM dd, yyyy 'at' h:mm a"
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedAssignment(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={submitting || submissions[selectedAssignment.id]?.status === "graded"}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {submissions[selectedAssignment.id] ? "Update Submission" : "Submit Assignment"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="text-lg font-semibold">Select an assignment</p>
                    <p className="text-sm text-muted-foreground">
                      Choose an assignment from the list to view details and submit
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Assignments;
