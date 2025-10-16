import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, TrendingUp, Clock, BookOpenCheck } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";

interface Enrollment {
  id: string;
  enrolled_at: string;
  status: string;
  progress: number;
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    short_description: string | null;
  };
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    totalHours: 0,
  });

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.user.id)
        .single();
      
      if (profile?.first_name) {
        setUserName(profile.first_name);
      }

      // Fetch enrollments
      fetchEnrollments(session.user.id);
    }
  };

  const fetchEnrollments = async (userId: string) => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        enrolled_at,
        status,
        progress,
        course:courses (
          id,
          title,
          thumbnail_url,
          short_description,
          duration_hours
        )
      `)
      .eq("student_id", userId)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      setEnrollments(data as any);
      
      // Calculate stats
      const completed = data.filter((e: any) => e.status === "completed").length;
      const inProgress = data.filter((e: any) => e.status === "active").length;
      const totalHours = data.reduce((acc: number, e: any) => acc + (e.course.duration_hours || 0), 0);
      
      setStats({
        total: data.length,
        completed,
        inProgress,
        totalHours,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      
      {/* Main Content */}
      <main className="ml-64 mt-[73px] p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome {userName}</h1>
          <p className="text-muted-foreground">Track your progress and continue your learning journey</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">Total Courses</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold">{stats.totalHours}</p>
            </CardContent>
          </Card>
        </div>

        {/* My Courses and Recent Activity Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Courses Section */}
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <BookOpenCheck className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No Courses Enrolled</h3>
                  <p className="text-sm text-muted-foreground">
                    Start your learning journey by enrolling in a course
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.slice(0, 3).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/student/course/${enrollment.course.id}`)}
                    >
                      {enrollment.course.thumbnail_url ? (
                        <img
                          src={enrollment.course.thumbnail_url}
                          alt={enrollment.course.title}
                          className="h-16 w-24 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{enrollment.course.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {enrollment.course.short_description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No Recent Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Your learning activity will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
