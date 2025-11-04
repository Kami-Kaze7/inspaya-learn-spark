import { Link } from "react-router-dom";
import { BookOpen, Search, Bell, ShoppingCart, User, ClipboardList, Award, MessageSquare, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  type: 'message' | 'announcement' | 'assignment' | 'grade';
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
  related_id?: string;
}

export const StudentHeader = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      }
    };
    getUserProfile();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchTotalUnreadCount();
      fetchRecentNotifications();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const messagesChannel = supabase
      .channel('messages-bell')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${currentUserId}`
      }, () => {
        fetchTotalUnreadCount();
        fetchRecentNotifications();
        toast.info("New message received");
      })
      .subscribe();

    const announcementsChannel = supabase
      .channel('announcements-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements'
      }, () => {
        fetchTotalUnreadCount();
        fetchRecentNotifications();
        toast.info("New announcement posted");
      })
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, (payload: any) => {
        fetchTotalUnreadCount();
        fetchRecentNotifications();
        const title = payload.new?.title || "New notification";
        toast.info(title);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentUserId]);

  const fetchTotalUnreadCount = async () => {
    if (!currentUserId) return;

    try {
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("recipient_id", currentUserId)
        .eq("read", false);

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId)
        .single();

      const role = userRoles?.role || 'student';
      const targetAudience = role === 'instructor' ? 'tutors' : 'students';

      const { data: announcements } = await supabase
        .from("announcements")
        .select("id")
        .or(`target_audience.eq.all,target_audience.eq.${targetAudience}`);

      let announcementsCount = 0;
      if (announcements) {
        const { data: viewedAnnouncements } = await supabase
          .from("announcement_views")
          .select("announcement_id")
          .eq("user_id", currentUserId)
          .in("announcement_id", announcements.map(a => a.id));

        const viewedIds = new Set(viewedAnnouncements?.map(v => v.announcement_id) || []);
        announcementsCount = announcements.filter(a => !viewedIds.has(a.id)).length;
      }

      const { count: notificationsCount } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", currentUserId)
        .eq("read", false);

      const total = (messagesCount || 0) + announcementsCount + (notificationsCount || 0);
      setTotalUnreadCount(total);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchRecentNotifications = async () => {
    if (!currentUserId) return;

    try {
      const allNotifications: NotificationItem[] = [];

      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_id, subject, content, read, created_at, profiles!messages_sender_id_fkey(full_name)")
        .eq("recipient_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(5);

      messages?.forEach(msg => {
        allNotifications.push({
          id: msg.id,
          type: 'message',
          title: msg.subject || 'New Message',
          message: `From ${(msg.profiles as any)?.full_name || 'Unknown'}`,
          link: '/student/messages',
          read: msg.read,
          created_at: msg.created_at
        });
      });

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId)
        .single();

      const role = userRoles?.role || 'student';
      const targetAudience = role === 'instructor' ? 'tutors' : 'students';

      const { data: announcements } = await supabase
        .from("announcements")
        .select("id, title, content, created_at")
        .or(`target_audience.eq.all,target_audience.eq.${targetAudience}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (announcements) {
        const { data: viewedAnnouncements } = await supabase
          .from("announcement_views")
          .select("announcement_id")
          .eq("user_id", currentUserId)
          .in("announcement_id", announcements.map(a => a.id));

        const viewedIds = new Set(viewedAnnouncements?.map(v => v.announcement_id) || []);

        announcements.forEach(ann => {
          allNotifications.push({
            id: ann.id,
            type: 'announcement',
            title: ann.title,
            message: ann.content.substring(0, 60) + '...',
            link: '/student/notifications',
            read: viewedIds.has(ann.id),
            created_at: ann.created_at
          });
        });
      }

      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(5);

      notifs?.forEach(notif => {
        allNotifications.push({
          id: notif.id,
          type: notif.type as 'assignment' | 'grade',
          title: notif.title,
          message: notif.message,
          link: notif.link,
          read: notif.read,
          created_at: notif.created_at,
          related_id: notif.related_id
        });
      });

      const sorted = allNotifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setNotifications(sorted);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (notification.type === 'message') {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("id", notification.id);
      } else if (notification.type === 'announcement') {
        await supabase
          .from("announcement_views")
          .upsert({
            user_id: currentUserId!,
            announcement_id: notification.id
          }, {
            onConflict: 'user_id,announcement_id'
          });
      } else if (notification.type === 'assignment' || notification.type === 'grade') {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notification.id);
      }

      fetchTotalUnreadCount();
      fetchRecentNotifications();
      navigate(notification.link);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-card">
      <div className="flex h-[73px] items-center justify-between px-6">
        {/* Logo */}
        <Link to="/student" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Inspaya</h1>
            <p className="text-xs text-muted-foreground">Learn Without Limits</p>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="flex items-center gap-2">
          <Button variant="default" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student">Dashboard</Link>
          </Button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalUnreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {totalUnreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>All Notifications</span>
                {totalUnreadCount > 0 && (
                  <Badge variant="secondary">{totalUnreadCount} unread</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {notif.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                      {notif.type === 'announcement' && <Megaphone className="h-4 w-4 text-purple-500" />}
                      {notif.type === 'assignment' && <ClipboardList className="h-4 w-4 text-orange-500" />}
                      {notif.type === 'grade' && <Award className="h-4 w-4 text-green-500" />}
                      <span className="font-medium text-sm flex-1">{notif.title}</span>
                      {!notif.read && (
                        <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              
              <DropdownMenuSeparator />
              <div className="grid grid-cols-2 gap-2 p-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/student/messages">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Messages
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/student/notifications">
                    <Megaphone className="h-3 w-3 mr-1" />
                    Announcements
                  </Link>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                {userName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/student/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
