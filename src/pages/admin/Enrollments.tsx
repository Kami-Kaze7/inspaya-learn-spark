import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, GraduationCap, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Enrollments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
  });

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
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/student");
      return;
    }

    fetchEnrollments();
  };

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          profiles!inner(full_name, email),
          courses!inner(title, price)
        `)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match expected structure
      const transformedData = data?.map(enrollment => ({
        ...enrollment,
        student: enrollment.profiles,
        course: enrollment.courses
      })) || [];

      setEnrollments(transformedData);
      const active = transformedData.filter(e => e.status === "active").length;
      const completed = transformedData.filter(e => e.status === "completed").length;
      const pending = transformedData.filter(e => e.status === "pending").length;
      
      setStats({
        total: transformedData.length,
        active,
        completed,
        pending,
      });
    } catch (error: any) {
      toast.error("Failed to fetch enrollments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({ status: "active", payment_verified: true })
        .eq("id", enrollmentId);

      if (error) throw error;
      toast.success("Enrollment approved!");
      fetchEnrollments();
    } catch (error: any) {
      toast.error("Failed to approve enrollment");
      console.error(error);
    }
  };

  const handleReject = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;
      toast.success("Enrollment rejected!");
      fetchEnrollments();
    } catch (error: any) {
      toast.error("Failed to reject enrollment");
      console.error(error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Course Enrollment Management</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="default" className="bg-green-600 hover:bg-green-700">
                + Enroll Student
              </Button>
              <Button>+ Bulk Enrollment</Button>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm font-medium mt-2">Total Enrollments</div>
                    </div>
                    <Users className="h-12 w-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-green-600">{stats.active}</div>
                      <div className="text-sm font-medium mt-2">Active Students</div>
                    </div>
                    <TrendingUp className="h-12 w-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-yellow-600">{stats.completed}</div>
                      <div className="text-sm font-medium mt-2">Completed</div>
                    </div>
                    <GraduationCap className="h-12 w-12 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-orange-600">{stats.pending}</div>
                      <div className="text-sm font-medium mt-2">Pending Approval</div>
                    </div>
                    <Clock className="h-12 w-12 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search Student/Course</label>
                <Input placeholder="Student name or course title..." />
              </div>
              <div className="w-64">
                <label className="text-sm font-medium mb-2 block">Filter by Course</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-64">
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold">📋 Course Enrollments</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STUDENT</TableHead>
                    <TableHead>COURSE</TableHead>
                    <TableHead>ENROLLMENT DATE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>PRICE</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        Loading enrollments...
                      </TableCell>
                    </TableRow>
                  ) : enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <div className="font-semibold text-lg">No Enrollments Found</div>
                        <div className="text-sm text-muted-foreground">Enrollments will appear here</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.student?.full_name || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{enrollment.student?.email || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.course?.title || "N/A"}</TableCell>
                        <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            enrollment.status === "pending" ? "secondary" :
                            enrollment.status === "active" ? "default" :
                            "outline"
                          }>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${enrollment.course?.price?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {enrollment.status === "pending" ? (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(enrollment.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(enrollment.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline">
                              {enrollment.payment_verified ? "Verified" : "Unverified"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
