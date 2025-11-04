import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Award, Upload, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

interface AwardedCertificate {
  id: string;
  student_id: string;
  course_id: string;
  awarded_at: string;
  profiles: { full_name: string };
  courses: { title: string };
}

interface CourseCertificate {
  id: string;
  course_id: string;
  certificate_image_url: string;
  courses: { title: string };
}

const Certificates = () => {
  const [awardedCertificates, setAwardedCertificates] = useState<AwardedCertificate[]>([]);
  const [courseCertificates, setCourseCertificates] = useState<CourseCertificate[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAwardedCertificates();
    fetchCourseCertificates();
    fetchAllCourses();

    const channel = supabase
      .channel('certificate-requests-page')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'certificate_requests'
      }, () => {
        fetchAwardedCertificates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAwardedCertificates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .order('awarded_at', { ascending: false });

    if (error) {
      console.error('Error fetching awarded certificates:', error);
      toast.error("Failed to load awarded certificates");
      setLoading(false);
      return;
    }

    // Fetch student names and course titles separately
    const studentIds = [...new Set(data?.map(r => r.student_id) || [])];
    const courseIds = [...new Set(data?.map(r => r.course_id) || [])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);

    const enrichedData = data?.map(cert => ({
      ...cert,
      profiles: { full_name: profiles?.find(p => p.id === cert.student_id)?.full_name || 'Unknown' },
      courses: { title: courses?.find(c => c.id === cert.course_id)?.title || 'Unknown' }
    })) || [];

    setAwardedCertificates(enrichedData as any);
    setLoading(false);
  };

  const fetchCourseCertificates = async () => {
    const { data, error } = await supabase
      .from('course_certificates')
      .select('*, courses(title)');

    if (error) {
      console.error('Error fetching course certificates:', error);
    } else {
      setCourseCertificates(data || []);
    }
  };

  const fetchAllCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url')
      .eq('status', 'published')
      .order('title');

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setAllCourses(data || []);
    }
  };

  const handleUploadCertificate = async (courseId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${courseId}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('course_certificates')
        .upsert({
          course_id: courseId,
          certificate_image_url: publicUrl
        }, {
          onConflict: 'course_id'
        });

      if (dbError) throw dbError;

      toast.success("Certificate uploaded successfully!");
      fetchCourseCertificates();
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error("Failed to upload certificate");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async (courseId: string, imageUrl: string) => {
    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('certificates')
          .remove([fileName]);
      }

      const { error } = await supabase
        .from('course_certificates')
        .delete()
        .eq('course_id', courseId);

      if (error) throw error;

      toast.success("Certificate deleted successfully!");
      fetchCourseCertificates();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error("Failed to delete certificate");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">Certificate Management</h1>
            <p className="text-muted-foreground">View awarded certificates and manage course certificate images</p>
          </div>

          <Tabs defaultValue="awarded" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="awarded">
                Awarded Certificates {awardedCertificates.length > 0 && `(${awardedCertificates.length})`}
              </TabsTrigger>
              <TabsTrigger value="courses">Course Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="awarded">
              <Card>
                <CardHeader>
                  <CardTitle>Awarded Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                  ) : awardedCertificates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
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
                        {awardedCertificates.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell className="font-medium">
                              {cert.profiles.full_name}
                            </TableCell>
                            <TableCell>{cert.courses.title}</TableCell>
                            <TableCell>
                              {format(new Date(cert.awarded_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Course Certificate Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {allCourses.map((course) => {
                      const certificate = courseCertificates.find(c => c.course_id === course.id);
                      return (
                        <Card key={course.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{course.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {certificate ? (
                              <div className="space-y-2">
                                <img
                                  src={certificate.certificate_image_url}
                                  alt={`${course.title} certificate`}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(certificate.certificate_image_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteCertificate(course.id, certificate.certificate_image_url)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <label className="flex-1">
                                    <Button size="sm" variant="outline" className="w-full" disabled={uploading}>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Replace
                                    </Button>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadCertificate(course.id, file);
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label>
                                <Button className="w-full" disabled={uploading}>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Certificate
                                </Button>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadCertificate(course.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Certificates;
