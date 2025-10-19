import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthModal } from "./AuthModal";

const Navigation = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");

  const handleOpenAuth = (tab: "signin" | "signup") => {
    setDefaultTab(tab);
    setIsAuthModalOpen(true);
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
              <Link to="/courses" className="text-sm font-medium hover:text-primary transition-colors">
                Courses
              </Link>
              <Link to="/student-works" className="text-sm font-medium hover:text-primary transition-colors">
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
