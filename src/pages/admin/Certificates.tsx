import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Award, Check, X, Upload, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

interface CertificateRequest {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
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
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [courseCertificates, setCourseCertificates] = useState<CourseCertificate[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchRequests();
    fetchCourseCertificates();
    fetchAllCourses();

    const channel = supabase
      .channel('certificate-requests-page')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'certificate_requests'
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      toast.error("Failed to load certificate requests");
      setLoading(false);
      return;
    }

    // Fetch student names separately
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

    const enrichedData = data?.map(request => ({
      ...request,
      profiles: { full_name: profiles?.find(p => p.id === request.student_id)?.full_name || 'Unknown' },
      courses: { title: courses?.find(c => c.id === request.course_id)?.title || 'Unknown' }
    })) || [];

    setRequests(enrichedData as any);
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

  const handleApprove = async () => {
    if (!selectedRequest || !currentUserId) return;

    try {
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentUserId
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedRequest.student_id,
          type: 'certificate_approved',
          title: 'Certificate Approved',
          message: `Your certificate for "${selectedRequest.courses.title}" has been approved and is ready to download!`,
          related_id: selectedRequest.id,
          link: '/student/certificates'
        });

      toast.success("Certificate approved successfully!");
      setShowApproveDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving certificate:', error);
      toast.error("Failed to approve certificate");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success("Certificate request rejected");
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting certificate:', error);
      toast.error("Failed to reject certificate");
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">Certificate Management</h1>
            <p className="text-muted-foreground">Manage certificate requests and course certificates</p>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="courses">Course Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Certificate Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                  ) : pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Award className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No pending requests</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.profiles.full_name}
                            </TableCell>
                            <TableCell>{request.courses.title}</TableCell>
                            <TableCell>
                              {format(new Date(request.requested_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved">
              <Card>
                <CardHeader>
                  <CardTitle>Approved Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  {approvedRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No approved certificates</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Approved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.profiles.full_name}
                            </TableCell>
                            <TableCell>{request.courses.title}</TableCell>
                            <TableCell>
                              {request.approved_at && format(new Date(request.approved_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rejected">
              <Card>
                <CardHeader>
                  <CardTitle>Rejected Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {rejectedRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No rejected requests</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.profiles.full_name}
                            </TableCell>
                            <TableCell>{request.courses.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {request.rejection_reason}
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

          <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Certificate Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve the certificate request for{" "}
                  <strong>{selectedRequest?.profiles.full_name}</strong> for the course{" "}
                  <strong>{selectedRequest?.courses.title}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Certificate Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason for rejecting this certificate request:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="my-4"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRejectionReason("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Certificates;
