import { useState, useEffect } from "react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface CompletedCourse {
  id: string;
  enrollment_id: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  completed_at: string;
  certificate_request?: {
    id: string;
    status: string;
    rejection_reason: string | null;
  };
  certificate_url?: string;
}

const Certificates = () => {
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletedCourses();

    const channel = supabase
      .channel('certificate-updates')
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
  }, []);

  const fetchCompletedCourses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          completed_at,
          progress,
          courses(id, title, thumbnail_url)
        `)
        .eq('student_id', user.id)
        .eq('progress', 100)
        .not('completed_at', 'is', null);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setCompletedCourses([]);
        setLoading(false);
        return;
      }

      const enrollmentIds = enrollments.map(e => e.id);
      const { data: requests } = await supabase
        .from('certificate_requests')
        .select('*')
        .in('enrollment_id', enrollmentIds);

      const { data: certificates } = await supabase
        .from('course_certificates')
        .select('*')
        .in('course_id', enrollments.map(e => e.course_id));

      const coursesWithCertificates = enrollments.map(enrollment => {
        const request = requests?.find(r => r.enrollment_id === enrollment.id);
        const certificate = certificates?.find(c => c.course_id === enrollment.course_id);

        return {
          id: enrollment.course_id,
          enrollment_id: enrollment.id,
          course: enrollment.courses as any,
          completed_at: enrollment.completed_at,
          certificate_request: request ? {
            id: request.id,
            status: request.status,
            rejection_reason: request.rejection_reason
          } : undefined,
          certificate_url: certificate?.certificate_image_url
        };
      });

      setCompletedCourses(coursesWithCertificates);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const requestCertificate = async (courseId: string, enrollmentId: string) => {
    setRequesting(courseId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('certificate_requests')
        .insert({
          student_id: user.id,
          course_id: courseId,
          enrollment_id: enrollmentId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Certificate request submitted! Admin will review it shortly.");
      fetchCompletedCourses();
    } catch (error) {
      console.error('Error requesting certificate:', error);
      toast.error("Failed to request certificate");
    } finally {
      setRequesting(null);
    }
  };

  const downloadCertificate = (certificateUrl: string, courseName: string) => {
    window.open(certificateUrl, '_blank');
    toast.success("Opening certificate...");
  };

  const getStatusBadge = (course: CompletedCourse) => {
    if (!course.certificate_request) {
      return <Badge variant="secondary">Eligible</Badge>;
    }

    switch (course.certificate_request.status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderActionButton = (course: CompletedCourse) => {
    if (!course.certificate_url) {
      return (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Certificate template not yet uploaded by admin
        </div>
      );
    }

    if (!course.certificate_request) {
      return (
        <Button
          className="w-full"
          onClick={() => requestCertificate(course.id, course.enrollment_id)}
          disabled={requesting === course.id}
        >
          <Award className="h-4 w-4 mr-2" />
          {requesting === course.id ? "Requesting..." : "Request Certificate"}
        </Button>
      );
    }

    switch (course.certificate_request.status) {
      case 'pending':
        return (
          <Button className="w-full" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Awaiting Admin Approval
          </Button>
        );
      case 'approved':
        return (
          <Button
            className="w-full"
            onClick={() => downloadCertificate(course.certificate_url!, course.course.title)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        );
      case 'rejected':
        return (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Reason: {course.certificate_request.rejection_reason}
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => requestCertificate(course.id, course.enrollment_id)}
              disabled={requesting === course.id}
            >
              Request Again
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-primary">My Certificates</h1>
          <p className="text-muted-foreground">
            View and download certificates for completed courses
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        ) : completedCourses.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <Award className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Certificates Yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete courses to earn certificates and showcase your achievements
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  {course.course.thumbnail_url ? (
                    <img
                      src={course.course.thumbnail_url}
                      alt={course.course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Award className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(course)}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{course.course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Completed: {format(new Date(course.completed_at), 'MMM d, yyyy')}
                  </p>
                </CardHeader>
                <CardContent>
                  {renderActionButton(course)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Certificates;
