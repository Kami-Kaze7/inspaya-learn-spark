import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, ClipboardCheck, Award } from "lucide-react";
import { toast } from "sonner";
import { getInstructorCourseIds } from "@/lib/instructorCourseAccess";

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    pendingSubmissions: 0,
    certificatesAwarded: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('instructor-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignment_submissions'
        },
        () => {
          // Refetch stats when submissions change
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) fetchStats(session.user.id);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_submissions'
        },
        () => {
          // Refetch stats when project submissions change
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) fetchStats(session.user.id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    fetchStats(session.user.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchStats = async (userId: string) => {
    try {
      // Get all course IDs the instructor has access to
      const courseIds = await getInstructorCourseIds(userId);

      // Count unique students across all instructor's courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id")
        .in("course_id", courseIds)
        .eq("status", "active");

      const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || []);

      // Count pending assignment submissions
      const { count: assignmentCount } = await supabase
        .from("assignment_submissions")
        .select("id", { count: "exact", head: true })
        .in("assignment_id", 
          (await supabase.from("assignments").select("id").in("course_id", courseIds)).data?.map(a => a.id) || []
        )
        .eq("status", "submitted");

      // Count pending project submissions
      const { count: projectCount } = await supabase
        .from("project_submissions")
        .select("id", { count: "exact", head: true })
        .in("project_id",
          (await supabase.from("projects").select("id").in("course_id", courseIds)).data?.map(p => p.id) || []
        )
        .eq("status", "submitted");

      // Count certificates awarded to students in instructor's courses
      const { count: certCount } = await supabase
        .from("certificate_requests")
        .select("id", { count: "exact", head: true })
        .in("course_id", courseIds)
        .not("awarded_at", "is", null);

      setStats({
        totalStudents: uniqueStudents.size,
        activeCourses: courseIds.length,
        pendingSubmissions: (assignmentCount || 0) + (projectCount || 0),
        certificatesAwarded: certCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all your courses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCourses}</div>
                  <p className="text-xs text-muted-foreground">
                    Courses you're teaching
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting your review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Certificates Awarded</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.certificatesAwarded}</div>
                  <p className="text-xs text-muted-foreground">
                    To your students
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
