import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Megaphone, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string;
  created_at: string;
  expires_at: string | null;
  author_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

const Notifications = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchAnnouncements();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setUserRole(roles?.role || 'student');
  };

  const fetchAnnouncements = async () => {
    try {
      const { data: announcementsData, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique author IDs
      const authorIds = [...new Set(announcementsData?.map(a => a.author_id) || [])];

      // Fetch profiles for all authors
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enriched: Announcement[] = announcementsData?.map(announcement => ({
        ...announcement,
        profiles: profileMap.get(announcement.author_id),
      })) || [];

      // Filter announcements based on user role
      const filtered = enriched.filter((announcement) => {
        if (announcement.target_audience === 'all') return true;
        if (userRole === 'student' && announcement.target_audience === 'students') return true;
        if (userRole === 'instructor' && announcement.target_audience === 'tutors') return true;
        return false;
      });

      setAnnouncements(filtered);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-primary">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with the latest announcements and important information</p>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>Recent Announcements</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No announcements yet</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} className={`relative border-l-4 ${getPriorityColor(announcement.priority)}`}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getPriorityBadgeColor(announcement.priority)}`}>
                        <Megaphone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="uppercase">{announcement.priority}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <h3 className="mb-2 text-lg font-bold">{announcement.title}</h3>
                        <p className="text-muted-foreground">{announcement.content}</p>
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>
                              {announcement.profiles?.first_name} {announcement.profiles?.last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(announcement.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
