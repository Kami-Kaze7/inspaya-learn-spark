import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, Award, TrendingUp, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Navigation from "@/components/Navigation";

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
      console.log("Fetching courses...");
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      console.log("Query result:", { data, error });
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Courses fetched:", data?.length || 0);
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
      <Navigation />
      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {/* Slide 1 */}
            <CarouselItem>
              <div className="relative" style={{ background: 'var(--gradient-hero-red)' }}>
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-5xl text-center">
                    <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                      Master New Skills
                      <br />
                      with Expert-Led Courses
                    </h1>
                    <p className="mb-8 text-lg text-white/90 md:text-xl">
                      Join thousands of learners advancing their careers with our course collection
                    </p>
                    
                    {/* Search Bar */}
                    <div className="mx-auto max-w-3xl mb-16">
                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          placeholder="Search for courses, skills, or topics..."
                          className="h-14 bg-white text-foreground placeholder:text-muted-foreground"
                        />
                        <Button 
                          size="lg" 
                          className="h-14 px-8 bg-[hsl(0,75%,55%)] hover:bg-[hsl(0,75%,50%)] text-white"
                        >
                          Search
                        </Button>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Users className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">50K+</div>
                        <div className="text-sm text-white/80">Active Students</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Play className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">1000+</div>
                        <div className="text-sm text-white/80">Video Courses</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Award className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">25K+</div>
                        <div className="text-sm text-white/80">Certificates Issued</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Star className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">4.9</div>
                        <div className="text-sm text-white/80">Average Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 2 */}
            <CarouselItem>
              <div className="relative" style={{ background: 'var(--gradient-hero-red)' }}>
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-5xl text-center">
                    <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                      Earn Industry-Recognized
                      <br />
                      Certificates
                    </h1>
                    <p className="mb-8 text-lg text-white/90 md:text-xl">
                      Boost your career with certifications trusted by top employers worldwide
                    </p>
                    
                    {/* Search Bar */}
                    <div className="mx-auto max-w-3xl mb-16">
                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          placeholder="Search for courses, skills, or topics..."
                          className="h-14 bg-white text-foreground placeholder:text-muted-foreground"
                        />
                        <Button 
                          size="lg" 
                          className="h-14 px-8 bg-[hsl(0,75%,55%)] hover:bg-[hsl(0,75%,50%)] text-white"
                        >
                          Search
                        </Button>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Award className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">25K+</div>
                        <div className="text-sm text-white/80">Certificates Issued</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <TrendingUp className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">92%</div>
                        <div className="text-sm text-white/80">Career Growth</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Users className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">500+</div>
                        <div className="text-sm text-white/80">Expert Instructors</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Star className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">4.9</div>
                        <div className="text-sm text-white/80">Average Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 3 */}
            <CarouselItem>
              <div className="relative" style={{ background: 'var(--gradient-hero-red)' }}>
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-5xl text-center">
                    <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                      Learn at Your Own Pace
                      <br />
                      Anytime, Anywhere
                    </h1>
                    <p className="mb-8 text-lg text-white/90 md:text-xl">
                      Flexible learning designed to fit your schedule and lifestyle
                    </p>
                    
                    {/* Search Bar */}
                    <div className="mx-auto max-w-3xl mb-16">
                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          placeholder="Search for courses, skills, or topics..."
                          className="h-14 bg-white text-foreground placeholder:text-muted-foreground"
                        />
                        <Button 
                          size="lg" 
                          className="h-14 px-8 bg-[hsl(0,75%,55%)] hover:bg-[hsl(0,75%,50%)] text-white"
                        >
                          Search
                        </Button>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Play className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">24/7</div>
                        <div className="text-sm text-white/80">Access</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <BookOpen className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">1000+</div>
                        <div className="text-sm text-white/80">Courses</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Users className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">50K+</div>
                        <div className="text-sm text-white/80">Students</div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
                        <Award className="h-10 w-10 mx-auto mb-3" />
                        <div className="text-3xl font-bold mb-1">100%</div>
                        <div className="text-sm text-white/80">Flexible</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          
          <CarouselPrevious className="left-4 md:left-8" />
          <CarouselNext className="right-4 md:right-8" />
        </Carousel>
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
      <section id="courses-section" className="container mx-auto px-4 py-20">
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
                  <Link to={`/course/${course.id}`} className="block h-full">
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-xl border-2 cursor-pointer">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        {course.thumbnail_url && (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="absolute inset-0 h-full w-full min-w-full min-h-full max-w-none object-cover object-center transition-transform group-hover:scale-105"
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
                        <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white">
                          Browse
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
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

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">What Our Students Say</h2>
          <p className="text-muted-foreground">Real stories from learners who transformed their careers</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                "The courses on Inspaya helped me transition into web development. The instructor explanations were clear and the projects were practical. Highly recommend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  SJ
                </div>
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-sm text-muted-foreground">Web Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                "I've taken multiple courses here and each one exceeded my expectations. The content is up-to-date and the community support is amazing!"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                  MC
                </div>
                <div>
                  <div className="font-semibold">Michael Chen</div>
                  <div className="text-sm text-muted-foreground">Data Analyst</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                "Best investment in my career! The certificates are recognized by employers and the skills I learned landed me a promotion."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  EP
                </div>
                <div>
                  <div className="font-semibold">Emily Patel</div>
                  <div className="text-sm text-muted-foreground">Marketing Manager</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                "As a busy professional, I appreciated the flexible learning schedule. The course quality is exceptional and worth every penny!"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                  DT
                </div>
                <div>
                  <div className="font-semibold">David Thompson</div>
                  <div className="text-sm text-muted-foreground">Product Manager</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                "The hands-on projects and real-world applications made learning enjoyable. I gained practical skills that I use daily in my job."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  AR
                </div>
                <div>
                  <div className="font-semibold">Aisha Rahman</div>
                  <div className="text-sm text-muted-foreground">UX Designer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                "From beginner to confident professional - this platform made it possible. The instructors are knowledgeable and always ready to help."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                  JL
                </div>
                <div>
                  <div className="font-semibold">James Lee</div>
                  <div className="text-sm text-muted-foreground">Software Engineer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Statistics Bar */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-3xl bg-[hsl(0,70%,60%)] p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-sm md:text-base text-white/90">Student Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">15K+</div>
              <div className="text-sm md:text-base text-white/90">Success Stories</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">92%</div>
              <div className="text-sm md:text-base text-white/90">Job Placement Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9/5</div>
              <div className="text-sm md:text-base text-white/90">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="w-full" style={{ background: 'var(--gradient-hero-red)' }}>
        <div className="container mx-auto px-4 py-16 text-center text-white">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">Stay Updated</h2>
          <p className="mb-8 text-lg text-white/90 max-w-2xl mx-auto">
            Get the latest course updates, learning tips, and exclusive offers delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email"
              className="h-12 bg-white text-foreground placeholder:text-muted-foreground flex-1"
            />
            <Button 
              size="lg" 
              className="h-12 px-8 bg-white text-[hsl(0,70%,50%)] hover:bg-white/90"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(220,20%,12%)] text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-8 w-8 text-[hsl(0,70%,60%)]" />
                <span className="text-xl font-bold">Inspaya</span>
              </div>
              <p className="text-white/70 mb-4">
                Empowering learners worldwide with online courses and industry-recognized certifications.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Popular Courses</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Free Courses</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Certifications</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Categories</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/courses" className="hover:text-white transition-colors">Video Editing</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Motion Graphics</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Ai courses</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-2 text-white/70">
                <li>support@inspaya.net</li>
                <li>+1 (555) 123-4567</li>
                <li>9b nza street enugu state</li>
              </ul>
              <div className="mt-4">
                <div className="font-semibold mb-2">Support Hours</div>
                <div className="text-sm text-white/70">Mon-Fri: 9:00 AM - 5:00 PM PST</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>&copy; 2025 Inspaya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
