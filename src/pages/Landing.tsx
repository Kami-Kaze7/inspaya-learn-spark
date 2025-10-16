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
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Featured Courses</h2>
          <p className="text-muted-foreground">Explore our most popular courses across different categories</p>
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
          <div className="space-y-16">
            {Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
              <div key={category} className="w-full">
                <h3 className="mb-6 text-2xl font-semibold">{category}</h3>
                <div className="flex flex-row gap-6 overflow-x-auto pb-4" style={{ display: 'flex', flexWrap: 'nowrap' }}>
                  {categoryCourses.map((course) => (
                    <Card key={course.id} className="group flex-none w-[300px] overflow-hidden transition-all hover:shadow-lg" style={{ flexShrink: 0 }}>
                      {course.thumbnail_url && (
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                          {course.price !== null && (
                            <span className="shrink-0 text-lg font-bold text-primary">
                              ${course.price}
                            </span>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {course.short_description || course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          {course.difficulty && (
                            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                              {course.difficulty}
                            </span>
                          )}
                          <Link to="/auth">
                            <Button variant="ghost" size="sm">
                              View Course
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
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
