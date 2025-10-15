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
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
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
