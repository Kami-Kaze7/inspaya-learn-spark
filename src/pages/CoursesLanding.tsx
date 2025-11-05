import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const CoursesLanding = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [courses]);

  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = searchQuery === "" || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || course.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [courses, searchQuery, selectedCategory, selectedDifficulty]);

  const activeFilterCount = (selectedCategory !== "All" ? 1 : 0) + (selectedDifficulty !== "All" ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero-red)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl animate-fade-in">
              Transform Your Career with
              <br />
              Expert-Led Courses
            </h1>
            <p className="mb-8 text-lg text-white/90 md:text-xl max-w-2xl mx-auto">
              Discover {courses.length}+ industry-leading courses designed to elevate your skills and accelerate your success
            </p>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                <span className="font-semibold">50,000+ Students</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold ml-1">4.9 Rating</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20">
                <div className="text-2xl md:text-3xl font-bold mb-1">{courses.length}+</div>
                <div className="text-sm text-white/80">Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20">
                <div className="text-2xl md:text-3xl font-bold mb-1">50K+</div>
                <div className="text-sm text-white/80">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20">
                <div className="text-2xl md:text-3xl font-bold mb-1">25K+</div>
                <div className="text-sm text-white/80">Certificates</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20">
                <div className="text-2xl md:text-3xl font-bold mb-1">4.9</div>
                <div className="text-sm text-white/80">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses, skills, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {difficulties.map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={selectedDifficulty === difficulty ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className="flex-shrink-0"
                >
                  {difficulty}
                </Button>
              ))}
            </div>

            {/* Active Filter Count */}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="flex-shrink-0">
                {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {filteredCourses.length === courses.length 
              ? 'All Courses' 
              : `${filteredCourses.length} Course${filteredCourses.length !== 1 ? 's' : ''} Found`}
          </h2>
          <p className="text-muted-foreground">
            Explore our comprehensive collection of expert-led courses
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto max-w-md">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedDifficulty("All");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Link 
                key={course.id} 
                to={`/course/${course.id}`} 
                className="group block animate-fade-in"
              >
                <Card className="h-full overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 border-2">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <span className="text-4xl font-bold text-muted-foreground opacity-20">
                          {course.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      {course.category && (
                        <Badge className="bg-primary text-primary-foreground">
                          {course.category}
                        </Badge>
                      )}
                      {course.difficulty && (
                        <Badge variant="secondary">
                          {course.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.short_description || course.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">4.8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>2.5k</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {course.price && course.price > 0 ? (
                          <div className="text-xl font-bold text-primary">
                            ${course.price}
                          </div>
                        ) : (
                          <Badge className="bg-green-600 text-white">Free</Badge>
                        )}
                      </div>
                    </div>

                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Learn More
                    </Button>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of students already transforming their careers with our expert-led courses
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Browse More Courses
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CoursesLanding;
