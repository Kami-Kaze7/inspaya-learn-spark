import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, TrendingUp, Clock, BookOpenCheck } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
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
      }
    };
    checkAuth();
  }, [navigate]);

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
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold">0</p>
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
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <BookOpenCheck className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No Courses Enrolled</h3>
                <p className="text-sm text-muted-foreground">
                  Start your learning journey by enrolling in a course
                </p>
              </div>
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
