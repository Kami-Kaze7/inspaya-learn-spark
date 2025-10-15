import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Announcements() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [targetAudience, setTargetAudience] = useState("all");
  const [expiresAt, setExpiresAt] = useState("");

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("announcements")
        .insert({
          title,
          content,
          author_id: session?.user.id,
        });

      if (error) throw error;

      toast.success("Announcement created successfully");
      setTitle("");
      setContent("");
      setPriority("medium");
      setTargetAudience("all");
      setExpiresAt("");
    } catch (error: any) {
      toast.error("Failed to create announcement");
      console.error(error);
    }
  };

  const handleReset = () => {
    setTitle("");
    setContent("");
    setPriority("medium");
    setTargetAudience("all");
    setExpiresAt("");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Announcements Management</h1>
              <p className="text-sm text-muted-foreground">
                Create and manage announcements for students and instructors
              </p>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Audience</label>
                      <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="students">Students</SelectItem>
                          <SelectItem value="instructors">Instructors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expires (Optional)</label>
                      <Input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      📢 Create Announcement
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleReset}>
                      🔄 Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
