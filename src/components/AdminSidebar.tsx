import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  Megaphone,
  MessageSquare,
  ClipboardList,
  LogOut,
  Award,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Instructors", url: "/admin/instructors", icon: GraduationCap },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Enrollments", url: "/admin/enrollments", icon: UserPlus },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Assignments", url: "/admin/assignments", icon: ClipboardList },
  { title: "Projects", url: "/admin/projects", icon: ClipboardList },
  { title: "Certificates", url: "/admin/certificates", icon: Award },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [pendingCertificates, setPendingCertificates] = useState(0);

  useEffect(() => {
    fetchPendingCertificates();

    const channel = supabase
      .channel('certificate-requests-admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'certificate_requests'
      }, () => {
        fetchPendingCertificates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingCertificates = async () => {
    const { count } = await supabase
      .from('certificate_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingCertificates(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === "Certificates" && pendingCertificates > 0 && (
                        <Badge className="ml-auto">{pendingCertificates}</Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
