import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";

interface CompletedCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
  completed_at: string;
  enrollment_id: string;
  certificate_request?: {
    id: string;
    awarded_at: string;
  };
  certificate_image?: {
    certificate_image_url: string;
  };
}

const Certificates = () => {
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchCompletedCourses();

      const channel = supabase
        .channel('certificate-requests-student')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'certificate_requests'
        }, () => {
          fetchCompletedCourses();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchCompletedCourses = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      // Fetch completed enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, course_id, completed_at, progress')
        .eq('student_id', currentUserId)
        .eq('progress', 100);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setCompletedCourses([]);
        setLoading(false);
        return;
      }

      // Fetch course details
      const courseIds = enrollments.map(e => e.course_id);
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url')
        .in('id', courseIds);

      if (courseError) throw courseError;

      // Fetch certificate requests
      const enrollmentIds = enrollments.map(e => e.id);
      const { data: certRequests, error: certError } = await supabase
        .from('certificate_requests')
        .select('id, enrollment_id, awarded_at')
        .in('enrollment_id', enrollmentIds);

      if (certError) throw certError;

      // Fetch course certificates (images)
      const { data: courseCerts, error: courseCertError } = await supabase
        .from('course_certificates')
        .select('course_id, certificate_image_url')
        .in('course_id', courseIds);

      if (courseCertError) throw courseCertError;

      // Combine data
      const combined = enrollments.map(enrollment => {
        const course = courses?.find(c => c.id === enrollment.course_id);
        const certRequest = certRequests?.find(cr => cr.enrollment_id === enrollment.id);
        const courseCert = courseCerts?.find(cc => cc.course_id === enrollment.course_id);

        return {
          id: course?.id || '',
          title: course?.title || 'Unknown Course',
          thumbnail_url: course?.thumbnail_url || null,
          completed_at: enrollment.completed_at || new Date().toISOString(),
          enrollment_id: enrollment.id,
          certificate_request: certRequest ? {
            id: certRequest.id,
            awarded_at: certRequest.awarded_at
          } : undefined,
          certificate_image: courseCert ? {
            certificate_image_url: courseCert.certificate_image_url
          } : undefined
        };
      });

      // Auto-award certificates for completed courses without certificate_request
      for (const course of combined) {
        if (!course.certificate_request && course.certificate_image) {
          await awardCertificate(course.enrollment_id, course.id);
        }
      }

      // Refetch after auto-awarding
      if (combined.some(c => !c.certificate_request && c.certificate_image)) {
        await fetchCompletedCourses();
        return;
      }

      setCompletedCourses(combined);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const awardCertificate = async (enrollmentId: string, courseId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('certificate_requests')
        .insert({
          student_id: currentUserId,
          course_id: courseId,
          enrollment_id: enrollmentId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error awarding certificate:', error);
    }
  };

  const downloadCertificate = (certificateUrl: string, courseName: string) => {
    window.open(certificateUrl, '_blank');
    toast.success("Certificate opened!");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <StudentHeader />
          <main className="flex-1 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary">My Certificates</h1>
              <p className="text-muted-foreground">View and download your earned certificates</p>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : completedCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold mb-2">No Certificates Yet</p>
                  <p className="text-muted-foreground">Complete courses to earn certificates!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedCourses.map((course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-32 object-cover rounded-t-lg mb-2"
                        />
                      )}
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Completed: {format(new Date(course.completed_at), 'MMM d, yyyy')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {course.certificate_image ? (
                        course.certificate_request ? (
                          <div className="space-y-2">
                            <Badge variant="default" className="w-full justify-center py-2">
                              <Award className="h-4 w-4 mr-2" />
                              Certificate Awarded
                            </Badge>
                            <Button
                              className="w-full"
                              onClick={() => downloadCertificate(
                                course.certificate_image!.certificate_image_url,
                                course.title
                              )}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Certificate
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-center py-2">
                            Processing...
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="w-full justify-center py-2">
                          Certificate Not Available
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Certificates;
