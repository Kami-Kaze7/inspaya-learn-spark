// Similar to student Notifications but with InstructorSidebar and filtered for instructors
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Megaphone, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Notifications() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    const channel = supabase.channel('announcements').on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAnnouncements).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    const authorIds = [...new Set(data?.map(a => a.author_id) || [])];
    const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", authorIds);
    const enriched = data?.map(a => ({ ...a, profiles: profiles?.find(p => p.id === a.author_id) })) || [];
    const filtered = enriched.filter(a => a.target_audience === 'all' || a.target_audience === 'tutors');
    setAnnouncements(filtered);
    setLoading(false);
  };

  const getPriorityColor = (p: string) => p === 'high' ? 'border-l-red-500' : p === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500';
  const getPriorityBadge = (p: string) => p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </header>
          <main className="flex-1 p-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Announcements</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAnnouncements}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <p className="text-center">Loading...</p> : announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No announcements yet</p>
                  </div>
                ) : (
                  announcements.map((a) => (
                    <Card key={a.id} className={`relative border-l-4 ${getPriorityColor(a.priority)}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getPriorityBadge(a.priority)}`}>
                            <Megaphone className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="uppercase">{a.priority}</Badge>
                              <span className="text-sm text-muted-foreground">{format(new Date(a.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                            <h3 className="mb-2 text-lg font-bold">{a.title}</h3>
                            <p className="text-muted-foreground">{a.content}</p>
                            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{a.profiles?.first_name} {a.profiles?.last_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(a.created_at), 'MMM dd, yyyy')}</span>
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
      </div>
    </SidebarProvider>
  );
}
