import { Link } from "react-router-dom";
import { BookOpen, Search, Bell, ShoppingCart, User } from "lucide-react";
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

export const StudentHeader = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      }
    };
    getUserProfile();
  }, []);

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

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              1
            </Badge>
          </Button>

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
