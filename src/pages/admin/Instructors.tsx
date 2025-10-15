import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  specialization?: string;
  status?: string;
}

export default function Instructors() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
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
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/student");
      return;
    }

    fetchInstructors();
  };

  const fetchInstructors = async () => {
    try {
      // Get all users with instructor role
      const { data: instructorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "instructor");

      if (rolesError) throw rolesError;

      const instructorIds = instructorRoles?.map(r => r.user_id) || [];

      if (instructorIds.length === 0) {
        setInstructors([]);
        setLoading(false);
        return;
      }

      // Get profiles for instructors
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", instructorIds);

      if (profilesError) throw profilesError;

      // Get email addresses from auth.users
      const instructorsWithEmails = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: user?.email || "N/A",
            created_at: profile.created_at,
            specialization: "General", // Placeholder
            status: "Active", // Placeholder
          };
        })
      );

      setInstructors(instructorsWithEmails);
    } catch (error: any) {
      toast.error("Failed to fetch instructors");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (instructorId: string) => {
    if (!confirm("Are you sure you want to delete this instructor?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", instructorId)
        .eq("role", "instructor");

      if (error) throw error;

      toast.success("Instructor deleted successfully");
      fetchInstructors();
    } catch (error: any) {
      toast.error("Failed to delete instructor");
      console.error(error);
    }
  };

  const handleMessage = (instructorId: string) => {
    navigate(`/admin/messages?recipient=${instructorId}`);
  };

  const handleEdit = (instructorId: string) => {
    toast.info("Edit functionality coming soon");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Instructors Management</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : instructors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No instructors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    instructors.map((instructor) => (
                      <TableRow key={instructor.id}>
                        <TableCell className="font-medium">{instructor.full_name}</TableCell>
                        <TableCell>{instructor.email}</TableCell>
                        <TableCell>{instructor.specialization}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            {instructor.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(instructor.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(instructor.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMessage(instructor.id)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(instructor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
