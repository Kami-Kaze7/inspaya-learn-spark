import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  Award,
  List,
  Bell,
  ClipboardList,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student" },
  { icon: BookOpen, label: "Total Courses", path: "/student/courses" },
  { icon: Award, label: "Certificates", path: "/student/certificates" },
  { icon: List, label: "Take a course", path: "/student/enroll" },
  { icon: Bell, label: "Notifications", path: "/student/notifications" },
  { icon: ClipboardList, label: "Assignments", path: "/student/assignments" },
  { icon: MessageSquare, label: "Messages", path: "/student/messages" },
];

export const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCounts();
      
      const messagesChannel = supabase
        .channel('messages-sidebar')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => fetchUnreadCounts()
        )
        .subscribe();

      const announcementsChannel = supabase
        .channel('announcements-sidebar')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'announcements'
          },
          () => fetchUnreadCounts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(announcementsChannel);
      };
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUserId) return;

    try {
      // Fetch unread messages
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("recipient_id", currentUserId)
        .eq("read", false);

      setUnreadMessages(messagesCount || 0);

      // Fetch user role
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId)
        .single();

      const role = userRoles?.role || 'student';
      const targetAudience = role === 'instructor' ? 'tutors' : role === 'admin' ? 'all' : 'students';

      // Fetch unread announcements (not viewed yet)
      const { data: announcements } = await supabase
        .from("announcements")
        .select("id")
        .or(`target_audience.eq.all,target_audience.eq.${targetAudience}`)
        .order("created_at", { ascending: false });

      if (announcements) {
        const announcementIds = announcements.map(a => a.id);
        
        if (announcementIds.length > 0) {
          const { data: viewedAnnouncements } = await supabase
            .from("announcement_views")
            .select("announcement_id")
            .eq("user_id", currentUserId)
            .in("announcement_id", announcementIds);

          const viewedIds = new Set(viewedAnnouncements?.map(v => v.announcement_id) || []);
          const unviewedCount = announcementIds.filter(id => !viewedIds.has(id)).length;
          
          setUnreadAnnouncements(unviewedCount);
        } else {
          setUnreadAnnouncements(0);
        }
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 border-r bg-card">
      <nav className="flex h-full flex-col p-4">
        <div className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            const showBadge = 
              (item.path === "/student/messages" && unreadMessages > 0) ||
              (item.path === "/student/notifications" && unreadAnnouncements > 0);
            
            const badgeCount = 
              item.path === "/student/messages" ? unreadMessages : 
              item.path === "/student/notifications" ? unreadAnnouncements : 
              0;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start relative",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 min-w-5 px-1 text-xs"
                    >
                      {badgeCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </nav>
    </aside>
  );
};
