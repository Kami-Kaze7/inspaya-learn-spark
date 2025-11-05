// Similar to admin Certificates but filtered for instructor's courses
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Certificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "instructor").maybeSingle();
    if (!roles) { toast.error("Access denied"); navigate("/student"); return; }
    fetchCertificates(session.user.id);
  };

  const fetchCertificates = async (userId: string) => {
    const { data: courses } = await supabase.from("courses").select("id").eq("instructor_id", userId);
    const courseIds = courses?.map(c => c.id) || [];
    const { data } = await supabase.from('certificate_requests').select('*').in('course_id', courseIds).order('awarded_at', { ascending: false });
    const studentIds = [...new Set(data?.map(r => r.student_id) || [])];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds);
    const { data: coursesData } = await supabase.from('courses').select('id, title').in('id', courseIds);
    const enriched = data?.map(cert => ({
      ...cert,
      profiles: { full_name: profiles?.find(p => p.id === cert.student_id)?.full_name || 'Unknown' },
      courses: { title: coursesData?.find(c => c.id === cert.course_id)?.title || 'Unknown' }
    })) || [];
    setCertificates(enriched);
    setLoading(false);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Certificates Awarded</h1>
          </header>
          <main className="flex-1 p-6">
            <Card>
              <CardHeader><CardTitle>Certificates</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p className="text-center">Loading...</p> : certificates.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Award className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No certificates awarded yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Awarded Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.profiles.full_name}</TableCell>
                          <TableCell>{cert.courses.title}</TableCell>
                          <TableCell>{format(new Date(cert.awarded_at), 'MMM d, yyyy')}</TableCell>
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
