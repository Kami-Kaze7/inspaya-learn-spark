import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Video, ArrowRight, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  difficulty: string;
  price: number;
  thumbnail_url: string;
  video_duration: string;
}

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  payment_verified: boolean;
  course: Course;
}

const Enroll = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetchCourses();
      fetchEnrollments();
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(*)
        `)
        .eq("student_id", user.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(data || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set((data || []).map((course) => course.category).filter(Boolean))
      );
      setCategories(uniqueCategories);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = activeTab === "all" 
    ? courses 
    : courses.filter((course) => course.category === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="mb-2 text-3xl font-bold text-primary">Browse Available Courses</h1>
        
        {/* My Enrollments Section */}
        {enrollments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>My Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-gradient-to-br from-primary to-primary/60">
                      {enrollment.course.thumbnail_url ? (
                        <img 
                          src={enrollment.course.thumbnail_url} 
                          alt={enrollment.course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-1">
                          {enrollment.course.title}
                        </CardTitle>
                        <Badge variant={
                          enrollment.status === "pending" ? "secondary" :
                          enrollment.status === "active" ? "default" :
                          "outline"
                        }>
                          {enrollment.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {enrollment.course.short_description || enrollment.course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/student/course/${enrollment.course.id}`)}
                        disabled={enrollment.status === "pending"}
                      >
                        {enrollment.status === "pending" ? "Awaiting Approval" : "Continue Learning"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Browse Courses by Category</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchCourses}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Courses</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="text-center py-8">Loading courses...</div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No courses available in this category
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                      <Card key={course.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                        <div 
                          onClick={() => navigate(`/student/course/${course.id}`)}
                          className="relative aspect-video bg-gradient-to-br from-primary to-primary/60"
                        >
                          {course.thumbnail_url ? (
                            <img 
                              src={course.thumbnail_url} 
                              alt={course.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Video className="h-12 w-12 text-white" />
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {course.short_description || course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{course.category}</Badge>
                            <Badge variant="outline">{course.difficulty}</Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{course.video_duration || "N/A"}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between">
                          <span className="text-xl font-bold text-primary">
                            ${course.price?.toFixed(2) || "0.00"}
                          </span>
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/student/course/${course.id}`)}
                          >
                            View Course
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Enroll;
