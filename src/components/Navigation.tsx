import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, ShoppingCart, GraduationCap, Award, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthModal } from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");

  const handleOpenAuth = (tab: "signin" | "signup") => {
    setDefaultTab(tab);
    setIsAuthModalOpen(true);
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
