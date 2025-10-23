import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { enrollmentIntent } from "@/lib/enrollmentIntent";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export const AuthModal = ({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userRole, setUserRole] = useState<"student" | "instructor">("student");
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        onClose();
        // Defer the role check to avoid blocking auth state change
        setTimeout(async () => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roles) {
            navigate("/admin");
          } else {
            // Check if user is instructor
            const { data: instructorRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .eq("role", "instructor")
              .maybeSingle();

            if (instructorRole) {
              navigate("/instructor");
            } else {
              // Check for pending physical enrollment
              const pendingEnrollmentStr = localStorage.getItem("pending_enrollment");
              if (pendingEnrollmentStr) {
                try {
                  const pendingEnrollment = JSON.parse(pendingEnrollmentStr);
                  if (pendingEnrollment.enrollmentType === "physical" && pendingEnrollment.courseId) {
                    // Create pending enrollment
                    const { error } = await supabase
                      .from("enrollments")
                      .insert({
                        student_id: session.user.id,
                        course_id: pendingEnrollment.courseId,
                        status: "pending",
                        payment_verified: false
                      });

                    localStorage.removeItem("pending_enrollment");

                    if (!error) {
                      toast.success("Enrollment request submitted! Awaiting admin approval.");
                      navigate(`/student/course/${pendingEnrollment.courseId}`);
                      return;
                    }
                  }
                } catch (err) {
                  console.error("Failed to process pending enrollment:", err);
                  localStorage.removeItem("pending_enrollment");
                }
              }

              // Check for pending online enrollment
              const pendingCourseId = enrollmentIntent.get();
              if (pendingCourseId) {
                navigate(`/student/course/${pendingCourseId}`);
              } else {
                navigate("/student");
              }
            }
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, onClose]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectUrl = userRole === "student" ? `${window.location.origin}/student` : `${window.location.origin}/instructor`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: userRole,
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify.");
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to Inspaya</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to continue your learning journey
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup value={userRole} onValueChange={(value) => setUserRole(value as "student" | "instructor")}>
                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer flex-1">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">Student</div>
                        <div className="text-sm text-muted-foreground">I want to learn and take courses</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="instructor" id="instructor" />
                    <Label htmlFor="instructor" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">Instructor</div>
                        <div className="text-sm text-muted-foreground">I want to create and teach courses</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">First Name</Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastname">Last Name</Label>
                  <Input
                    id="signup-lastname"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
