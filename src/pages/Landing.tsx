import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  price: number;
  thumbnail_url: string;
  difficulty: string;
}

const Landing = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const coursesByCategory = courses.reduce((acc, course) => {
    const category = course.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              Welcome to Inspaya
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              Transform your learning journey with our innovative online platform. 
              Master new skills, connect with experts, and achieve your goals.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
                  Get Started
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose Inspaya?</h2>
          <p className="text-muted-foreground">Everything you need for effective online learning</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Rich Content</h3>
            <p className="text-muted-foreground">
              Access a vast library of courses across multiple disciplines
            </p>
          </div>

          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Expert Instructors</h3>
            <p className="text-muted-foreground">
              Learn from industry professionals and certified educators
            </p>
          </div>

          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Certifications</h3>
            <p className="text-muted-foreground">
              Earn recognized certificates upon course completion
            </p>
          </div>

          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your learning journey with detailed analytics
            </p>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl text-red-700">Featured Courses</h2>
          <p className="text-base text-muted-foreground max-w-3xl mx-auto">
            Hand-picked courses from industry experts, designed to fast-track your career growth
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses available yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {courses.map((course) => (
                <div key={course.id} className="flex-shrink-0 w-[350px] snap-start">
                  <Card className="group h-full overflow-hidden transition-all hover:shadow-xl border-2">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {course.thumbnail_url && (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {course.category && (
                          <span className="px-3 py-1 text-xs font-semibold rounded bg-red-600 text-white">
                            {course.category}
                          </span>
                        )}
                        {course.difficulty && (
                          <span className="px-3 py-1 text-xs font-semibold rounded bg-background/90">
                            {course.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-xl font-bold line-clamp-2">
                        {course.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">by Inspaya Team</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">4.8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>12,350</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Multiple</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Link to={`/course/${course.id}`}>
                        <Button className="w-full group-hover:bg-green-600 transition-colors bg-green-600 hover:bg-green-700 text-white">
                          Browse
                          <span className="ml-2">→</span>
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-12 text-center text-primary-foreground shadow-2xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Start Learning?</h2>
          <p className="mb-8 text-lg opacity-90">
            Join thousands of students already learning on Inspaya
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-shadow">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
