import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Users } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  full_name: string;
  email: string;
  course_title: string;
  enrollment_status: string;
  progress: number;
}

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchStudents(session.user.id);
  };

  const fetchStudents = async (userId: string) => {
    try {
      // Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", userId);

      const courseIds = courses?.map(c => c.id) || [];

      if (courseIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get enrollments for these courses
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select(`
          student_id,
          status,
          progress,
          course:courses(title)
        `)
        .in("course_id", courseIds);

      if (error) throw error;

      // Get unique student IDs
      const studentIds = [...new Set(enrollments?.map(e => e.student_id) || [])];

      // Fetch student profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);

      // Combine data
      const studentsData: Student[] = [];
      enrollments?.forEach(enrollment => {
        const profile = profiles?.find(p => p.id === enrollment.student_id);
        if (profile) {
          studentsData.push({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            course_title: (enrollment.course as any)?.title || "Unknown",
            enrollment_status: enrollment.status,
            progress: enrollment.progress || 0
          });
        }
      });

      setStudents(studentsData);
    } catch (error: any) {
      toast.error("Failed to fetch students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">My Students</h1>
              <p className="text-sm text-muted-foreground">Students enrolled in your courses</p>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">Loading students...</p>
                ) : students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No students enrolled yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={`${student.id}-${student.course_title}`}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.course_title}</TableCell>
                          <TableCell>
                            <Badge variant={
                              student.enrollment_status === "active" ? "default" :
                              student.enrollment_status === "pending" ? "secondary" :
                              "outline"
                            }>
                              {student.enrollment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-sm">{student.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => navigate(`/instructor/messages?user=${student.id}`)}
                            >
                              <Mail className="h-4 w-4" />
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
