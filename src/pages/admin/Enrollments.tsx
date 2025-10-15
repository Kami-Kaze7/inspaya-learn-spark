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
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    inProgress: 0,
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
        .select("*");

      if (error) throw error;

      const active = data?.filter(e => e.status === "active").length || 0;
      const completed = data?.filter(e => e.status === "completed").length || 0;
      
      setStats({
        total: data?.length || 0,
        active,
        completed,
        inProgress: active,
      });
    } catch (error: any) {
      toast.error("Failed to fetch enrollments");
      console.error(error);
    } finally {
      setLoading(false);
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
                      <div className="text-4xl font-bold text-cyan-600">{stats.inProgress}</div>
                      <div className="text-sm font-medium mt-2">In Progress</div>
                    </div>
                    <Clock className="h-12 w-12 text-cyan-600" />
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
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <div className="font-semibold text-lg">No Enrollments Found</div>
                      <div className="text-sm text-muted-foreground">Enrollments will appear here</div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
