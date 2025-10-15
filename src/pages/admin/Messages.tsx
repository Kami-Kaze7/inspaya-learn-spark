import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function Messages() {
  const navigate = useNavigate();

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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  Communicate directly with students and tutors
                </p>
              </div>
            </div>
            <Button>+ New Message</Button>
          </header>

          <main className="flex-1 flex">
            <div className="w-96 border-r bg-muted/20 p-6">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <div className="font-semibold">No conversations yet</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Start a conversation to begin messaging
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <MessageSquare className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <div className="text-xl font-semibold mb-2">Select a conversation</div>
                <div className="text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
