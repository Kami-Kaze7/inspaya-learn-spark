import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, PlayCircle, Clock, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert YouTube URL to embed URL
const getEmbedUrl = (url: string) => {
  if (!url) return null;
  
  // Check if it's a YouTube URL
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  // If not YouTube, return original URL (for direct video files)
  return url;
};

const isYouTubeUrl = (url: string) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_duration: string;
  is_free: boolean;
  order_index: number;
}

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
  video_url?: string;
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchCourseDetails();
    checkEnrollment();
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

      // Fetch modules and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select(`
          id,
          title,
          description,
          order_index,
          course_lessons (
            id,
            title,
            description,
            video_url,
            video_duration,
            is_free,
            order_index
          )
        `)
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;

      const formattedModules = modulesData.map((module: any) => ({
        ...module,
        lessons: (module.course_lessons || []).sort(
          (a: Lesson, b: Lesson) => a.order_index - b.order_index
        ),
      }));

      setModules(formattedModules);
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

  const checkEnrollment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    setIsEnrolled(!!data);
  };

  const handleEnroll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({
          student_id: user.id,
          course_id: courseId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enrolled successfully!",
      });
      setIsEnrolled(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.is_free && !isEnrolled) {
      toast({
        title: "Locked",
        description: "Please enroll to access this lesson",
        variant: "destructive",
      });
      return;
    }
    setSelectedLesson(lesson);
  };

  // Determine what video to show
  const currentVideo = selectedLesson?.video_url || course?.video_url;
  const currentVideoTitle = selectedLesson ? selectedLesson.title : course?.title;
  const currentVideoDescription = selectedLesson ? selectedLesson.description : course?.short_description;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentHeader />
        <StudentSidebar />
        <main className="ml-64 mt-[73px] p-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <StudentHeader />
        <StudentSidebar />
        <main className="ml-64 mt-[73px] p-8">
          <div className="text-center">Course not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <Button variant="ghost" onClick={() => navigate("/student/enroll")} className="mb-4">
          ← Back to Courses
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black relative">
                  {currentVideo ? (
                    isYouTubeUrl(currentVideo) ? (
                      <iframe
                        key={currentVideo}
                        src={getEmbedUrl(currentVideo)}
                        className="h-full w-full absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={currentVideo}
                        src={currentVideo}
                        controls
                        className="h-full w-full absolute inset-0 object-contain bg-black"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-white">
                      <div className="text-center">
                        <PlayCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                        <p className="text-muted-foreground">No preview video available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Info */}
            {selectedLesson && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    {currentVideoTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLesson.video_duration && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {selectedLesson.video_duration}
                    </div>
                  )}
                  {currentVideoDescription && (
                    <p className="text-muted-foreground">{currentVideoDescription}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Course Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.difficulty}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {course.video_duration}
                  </div>
                </div>
                <p className="text-muted-foreground">{course.description}</p>
                
                {!isEnrolled && (
                  <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-2xl font-bold">${course.price}</p>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                    <Button onClick={handleEnroll}>Enroll Now</Button>
                  </div>
                )}
                {isEnrolled && (
                  <div className="mt-6 rounded-lg border border-green-500 bg-green-500/10 p-4 text-center">
                    <p className="font-semibold text-green-600">✓ Enrolled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lessons Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                <Accordion type="single" collapsible className="w-full">
                  {modules.map((module, idx) => (
                    <AccordionItem key={module.id} value={`module-${idx}`}>
                      <AccordionTrigger className="text-left">
                        <div>
                          <div className="font-semibold">{module.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {module.lessons.length} lessons
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => {
                            const canAccess = lesson.is_free || isEnrolled;
                            const isActive = selectedLesson?.id === lesson.id;
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson)}
                                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${!canAccess ? "opacity-60" : ""} ${isActive ? "bg-accent border-primary" : ""}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {canAccess ? (
                                        <PlayCircle className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="text-sm font-medium">
                                        {lesson.title}
                                      </span>
                                    </div>
                                    {lesson.video_duration && (
                                      <div className="ml-6 mt-1 text-xs text-muted-foreground">
                                        {lesson.video_duration}
                                      </div>
                                    )}
                                  </div>
                                  {lesson.is_free && (
                                    <Badge variant="secondary" className="text-xs">
                                      Free
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
