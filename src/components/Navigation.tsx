import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, ShoppingCart, GraduationCap, Award, ChevronDown, LayoutDashboard, LogOut, BookOpenCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthModal } from "./AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    setUserRole(data?.role ?? "student");
    
    // Fetch user profile for display name
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();
    
    if (profileData?.first_name) {
      setUserName(profileData.first_name + (profileData.last_name ? ` ${profileData.last_name}` : ""));
    }
  };

  const handleOpenAuth = (tab: "signin" | "signup") => {
    setDefaultTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "instructor") return "/instructor";
    return "/student";
  };

  const scrollToCourses = () => {
    const coursesSection = document.querySelector('#courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">Inspaya</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors outline-none">
                  <GraduationCap className="h-4 w-4" />
                  Courses
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background z-50">
                  <DropdownMenuItem onClick={scrollToCourses}>
                    <span className="cursor-pointer">All Courses</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/course/baf3b789-4056-4b86-ac15-1dc661efe5a8" className="cursor-pointer">
                      AI COURSES
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/course/e1d9d470-84aa-437b-9ad8-ea3dec41eca5" className="cursor-pointer">
                      MOTION GRAPHICS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/course/64f73d33-3b79-4628-8662-cc3b73a25388" className="cursor-pointer">
                      VIDEO EDITING
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/courses" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <BookOpenCheck className="h-4 w-4" />
                Browse All Courses
              </Link>
              <Link to="/student-works" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <Award className="h-4 w-4" />
                View Our Students Works
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">{userName || user?.email || "My Account"}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background z-50">
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="cursor-pointer flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer flex items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleOpenAuth("signin")}
                    className="hidden sm:inline-flex"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => handleOpenAuth("signup")}
                    className="bg-[hsl(0,75%,55%)] hover:bg-[hsl(0,75%,50%)] text-white"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={defaultTab}
      />
    </>
  );
};

export default Navigation;
