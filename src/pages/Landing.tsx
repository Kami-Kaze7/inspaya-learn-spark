import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, Award, TrendingUp, Play, Star } from "lucide-react";
import logo from "@/assets/logo.png";
import heroSlide1 from "@/assets/hero/slide1.jpg";
import heroSlide2 from "@/assets/hero/slide2.jpg";
import heroSlide3 from "@/assets/hero/slide3.jpg";
import heroSlide4 from "@/assets/hero/slide4.jpg";
import heroSlide5 from "@/assets/hero/slide5.jpg";
import testimonialEsther from "@/assets/testimonials/esther-onuh.png";
import testimonialHenrii from "@/assets/testimonials/henrii.png";
import testimonialCharles from "@/assets/testimonials/charles-maryfrancis.png";
import testimonialChisom from "@/assets/testimonials/chisom-nwachukwu.png";
import testimonialEkechi from "@/assets/testimonials/ekechi-wisdom.png";
import testimonialSamuel from "@/assets/testimonials/ogwuche-samuel.png";
import testimonialChukwuemeka from "@/assets/testimonials/chukwuemeka-somadina.png";
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
              <div 
                className="relative bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroSlide1})` }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-4xl text-center text-white">
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                      Master New Skills
                    </h1>
                    <p className="mb-8 text-xl text-white/90">
                      Learn from industry experts and advance your career with our comprehensive online courses
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                      <Link to="/courses">
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                          Browse Courses
                        </Button>
                      </Link>
                      <Link to="/auth">
                        <Button size="lg" variant="hero" className="w-full sm:w-auto">
                          Get Started Free
                        </Button>
                      </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">10,000+</div>
                          <div className="text-white/80">Active Students</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">500+</div>
                          <div className="text-white/80">Expert Instructors</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">95%</div>
                          <div className="text-white/80">Success Rate</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 2 */}
            <CarouselItem>
              <div 
                className="relative bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroSlide2})` }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-4xl text-center text-white">
                    <Award className="mx-auto mb-6 h-16 w-16" />
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                      Earn Industry-Recognized Certificates
                    </h1>
                    <p className="mb-8 text-xl text-white/90">
                      Complete courses and receive certificates that boost your career prospects
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                      <Link to="/courses">
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                          View Certificates
                        </Button>
                      </Link>
                      <Link to="/auth">
                        <Button size="lg" variant="hero" className="w-full sm:w-auto">
                          Start Learning
                        </Button>
                      </Link>
                    </div>

                    {/* Achievement Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">50,000+</div>
                          <div className="text-white/80">Certificates Issued</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">200+</div>
                          <div className="text-white/80">Course Options</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">24/7</div>
                          <div className="text-white/80">Learning Access</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 3 */}
            <CarouselItem>
              <div 
                className="relative bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroSlide3})` }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-4xl text-center text-white">
                    <TrendingUp className="mx-auto mb-6 h-16 w-16" />
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                      Learn at Your Own Pace
                    </h1>
                    <p className="mb-8 text-xl text-white/90">
                      Flexible learning that fits your schedule - study anytime, anywhere
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                      <Link to="/courses">
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                          Explore Courses
                        </Button>
                      </Link>
                      <Link to="/auth">
                        <Button size="lg" variant="hero" className="w-full sm:w-auto">
                          Join Today
                        </Button>
                      </Link>
                    </div>

                    {/* Learning Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">100+</div>
                          <div className="text-white/80">Hours of Content</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">Mobile</div>
                          <div className="text-white/80">Learn on the Go</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">Lifetime</div>
                          <div className="text-white/80">Course Access</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 4 */}
            <CarouselItem>
              <div 
                className="relative bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroSlide4})` }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-4xl text-center text-white">
                    <Award className="mx-auto mb-6 h-16 w-16" />
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                      Celebrating Excellence & Achievement
                    </h1>
                    <p className="mb-8 text-xl text-white/90">
                      Join a community that recognizes and rewards your hard work with prestigious awards and industry recognition
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                      <Link to="/courses">
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                          See Success Stories
                        </Button>
                      </Link>
                      <Link to="/auth">
                        <Button size="lg" variant="hero" className="w-full sm:w-auto">
                          Enroll Now
                        </Button>
                      </Link>
                    </div>

                    {/* Recognition Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">250+</div>
                          <div className="text-white/80">Awards Given</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">98%</div>
                          <div className="text-white/80">Graduate Success Rate</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">150+</div>
                          <div className="text-white/80">Industry Partners</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 5 */}
            <CarouselItem>
              <div 
                className="relative bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroSlide5})` }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="container relative mx-auto px-4 py-20 md:py-32">
                  <div className="mx-auto max-w-4xl text-center text-white">
                    <Users className="mx-auto mb-6 h-16 w-16" />
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                      Transform Your Future Today
                    </h1>
                    <p className="mb-8 text-xl text-white/90">
                      Experience the joy of achievement as you transition from student to certified professional in your chosen field
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                      <Link to="/courses">
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                          View Programs
                        </Button>
                      </Link>
                      <Link to="/auth">
                        <Button size="lg" variant="hero" className="w-full sm:w-auto">
                          Join Community
                        </Button>
                      </Link>
                    </div>

                    {/* Success Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">5,000+</div>
                          <div className="text-white/80">Successful Graduates</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">92%</div>
                          <div className="text-white/80">Career Placement</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
                          <div className="text-white/80">Student Satisfaction</div>
                        </CardContent>
                      </Card>
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
          <Card className="bg-card hover:shadow-lg transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground flex-grow">
                "The AI Content Creation course I took at Inspaya completely transformed my workflow and mindset. I can now create stunning visuals and engaging videos effortlessly. Highly recommend!"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <img 
                  src={testimonialEsther} 
                  alt="Esther Onuh" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">Esther Onuh</div>
                  <div className="text-sm text-muted-foreground">AI Content Creator</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground flex-grow">
                "This program is the real deal. As a video editor, I needed practical, hands-on skills, and that's exactly what I got. The instructors were amazing and focused on real-world projects, which gave me the confidence to start working professionally. Being chosen for an internship here was the perfect way to start my career. I rate them 5/5… I highly recommend. Thank you. Henrii"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <img 
                  src={testimonialHenrii} 
                  alt="Henrii" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">Henrii</div>
                  <div className="text-sm text-muted-foreground">Video Editor</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground flex-grow">
                "Inspaya isn't just another training center, it's a creative powerhouse that transforms ordinary minds into industry-ready creators. I would say that the blend of practical learning, real-world projects, and supportive mentors equipped me into becoming a better creative professional. If you're serious about mastering media and digital creativity, Inspaya is the place to be."
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <img 
                  src={testimonialCharles} 
                  alt="Charles C.O. MaryFrancis" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">Charles C.O. MaryFrancis</div>
                  <div className="text-sm text-muted-foreground">Creative Professional (McChuks Concepts)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground flex-grow">
                "Joining Inspaya as a beginner in AI content creation was a life-changing experience. The hands-on training was practical, engaging, and perfectly structured to help me build real skills from scratch. The tutors were knowledgeable, approachable, and truly dedicated to our growth. Inspaya provides an inspiring environment that encourages creativity and continuous learning. Being selected as an intern has allowed me to keep improving and exploring more in AI. I proudly rate Inspaya ⭐⭐⭐⭐⭐ for their excellence and highly recommend them to anyone passionate about digital innovation. Thank you INSPAYA."
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <img 
                  src={testimonialChisom} 
                  alt="Nwachukwu Chisom Favour" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">Nwachukwu Chisom Favour</div>
                  <div className="text-sm text-muted-foreground">AI Content Creator</div>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow h-full">
              <CardContent className="pt-6 flex flex-col h-full">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-6 text-muted-foreground flex-grow">
                  "Inspaya is an amazing platform that has taken my video editing and AI content creation skills to the next level! The interactive assignments and personalized feedback from instructors are incredibly helpful. I've learned so much in such a short time, and I'm loving every moment of it! The user-friendly interface makes it easy to navigate and access all the resources I need. Overall, I'd give Inspire 5/5 stars - it's a must-try for anyone looking to boost their creative skills!"
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <Avatar>
                    <AvatarImage src={testimonialEkechi} />
                    <AvatarFallback>EW</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Ekechi Wisdom</div>
                    <div className="text-sm text-muted-foreground">Video Editor & AI Content Creator</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground flex-grow">
                "If you're looking for a place to learn editing or improve your production skills, this is the right spot. Their training is practical and flexible, and you actually leave with real skills you can start using immediately."
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <Avatar>
                  <AvatarImage src={testimonialSamuel} />
                  <AvatarFallback>OS</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">Ogwuche Samuel</div>
                  <div className="text-sm text-muted-foreground">Videographer/Editor</div>
                </div>
                  </div>
                </CardContent>
              </Card>

          {/* Chukwuemeka Somadina */}
          <Card className="bg-card hover:shadow-lg transition-shadow h-full">
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground flex-grow">
                "Inspaya opened doors I never knew existed. The motion graphics course was incredibly comprehensive, and the instructor's industry experience really showed. I'm now freelancing full-time and couldn't be happier with my career transition!"
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src={testimonialChukwuemeka}
                  alt="Chukwuemeka Somadina"
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">Chukwuemeka Somadina</div>
                  <div className="text-sm text-muted-foreground">Motion Graphics Specialist</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <div className="mb-4">
                <img 
                  src={logo} 
                  alt="Inspaya" 
                  className="h-10 object-contain"
                />
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
