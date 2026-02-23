import { useEffect, useState } from "react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Enrollment {
  id: string;
  enrolled_at: string;
  status: string;
  progress: number;
  course: {
    id: string;
    title: string;
    price: number;
    instructor_id: string | null;
  };
  instructor_name?: string;
}

const Courses = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
          price,
          instructor_id
        )
      `)
      .eq("student_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      // Fetch instructor names
      const instructorIds = [...new Set((data as any[]).map(e => e.course?.instructor_id).filter(Boolean))];
      let instructorMap: Record<string, string> = {};
      if (instructorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", instructorIds);
        if (profiles) {
          instructorMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
        }
      }
      const enriched = (data as any[]).map(e => ({
        ...e,
        instructor_name: instructorMap[e.course?.instructor_id] || "N/A",
      }));
      setEnrollments(enriched);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="mb-2 text-3xl font-bold text-primary">My Registered Courses</h1>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Total Courses Registered: {enrollments.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[200px] text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[400px] text-center">
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No Registered Courses</h3>
                        <p className="text-sm text-muted-foreground">
                          Enroll in courses to see them here
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enrollment) => (
                    <TableRow 
                      key={enrollment.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/student/course/${enrollment.course.id}`)}
                    >
                      <TableCell className="font-medium">{enrollment.course.title}</TableCell>
                      <TableCell>{enrollment.instructor_name}</TableCell>
                      <TableCell>${enrollment.course.price}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell>{format(new Date(enrollment.enrolled_at), "MMM dd, yyyy")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Courses;
