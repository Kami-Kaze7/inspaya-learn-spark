import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Clock, DollarSign, Globe, Award, Users, PlayCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  difficulty: string;
  price: number;
  thumbnail_url: string;
  video_url: string;
  duration_hours: number;
  duration_minutes: number;
  language: string;
  requirements: string;
  what_you_learn: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url: string;
  video_duration: string;
  order_index: number;
}

const PublicCourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("status", "published")
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Fetch lessons for each module
      const lessonsMap: Record<string, Lesson[]> = {};
      for (const module of modulesData || []) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("course_lessons")
          .select("*")
          .eq("module_id", module.id)
          .order("order_index", { ascending: true });

        if (!lessonsError && lessonsData) {
          lessonsMap[module.id] = lessonsData;
        }
      }
      setLessons(lessonsMap);
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Course not found</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(course.video_url);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Inspaya
          </Link>
          <Link to="/auth">
            <Button>Enroll Now</Button>
          </Link>
        </div>
      </header>

      {/* Course Header */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex gap-2 mb-4">
                {course.category && (
                  <Badge variant="secondary">{course.category}</Badge>
                )}
                {course.difficulty && (
                  <Badge variant="outline">{course.difficulty}</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">
                {course.short_description || course.description}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                {course.price !== null && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">${course.price}</span>
                  </div>
                )}
                {course.duration_hours !== null && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>{course.duration_hours}h {course.duration_minutes}m</span>
                  </div>
                )}
                {course.language && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-5 w-5" />
                    <span>{course.language}</span>
                  </div>
                )}
              </div>

              <Link to="/auth">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Enroll Now
                </Button>
              </Link>
            </div>

            {/* Video Preview */}
            <div>
              {videoId ? (
                <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={course.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full rounded-lg shadow-2xl"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.what_you_learn && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{course.what_you_learn}</p>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{course.description}</p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {course.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{course.requirements}</p>
                </CardContent>
              </Card>
            )}

            {/* Course Content/Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
                <CardDescription>
                  {modules.length} modules • {Object.values(lessons).flat().length} lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {modules.map((module, index) => (
                    <AccordionItem key={module.id} value={`module-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-start gap-2 text-left">
                          <span className="font-semibold">Module {index + 1}:</span>
                          <span>{module.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {module.description}
                          </p>
                        )}
                        <div className="space-y-2">
                          {lessons[module.id]?.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                            >
                              <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                {lesson.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                              {lesson.video_duration && (
                                <span className="text-xs text-muted-foreground">
                                  {lesson.video_duration}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Course Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">12,350</p>
                    <p className="text-sm text-muted-foreground">Students Enrolled</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">4.8 ★</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
                {course.language && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{course.language}</p>
                      <p className="text-sm text-muted-foreground">Language</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Link to="/auth">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Enroll Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicCourseDetail;
