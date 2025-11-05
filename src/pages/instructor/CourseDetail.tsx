// This is an exact copy of student CourseDetail but with InstructorSidebar
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, PlayCircle, Clock, BookOpen, FileText, Award, Building2, UsersRound, Handshake, Check, MapPin, Copy, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/PaymentForm";
import { enrollmentIntent } from "@/lib/enrollmentIntent";
import { CourseVideoChat } from "@/components/CourseVideoChat";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Helper function to convert YouTube URL to embed URL
const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/s]{11})/;
  const match = url.match(youtubeRegex);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
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
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [user, setUser] = useState<any>(undefined);
  const [lessonAssignment, setLessonAssignment] = useState<any>(null);
  const [showPhysicalDialog, setShowPhysicalDialog] = useState(false);
  const [showPhysicalPaymentDialog, setShowPhysicalPaymentDialog] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    checkEnrollment();
    fetchUser();
  }, [courseId]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  useEffect(() => {
    const handlePendingEnrollment = async () => {
      const pendingCourseId = enrollmentIntent.get();
      
      if (pendingCourseId && pendingCourseId === courseId && course && user) {
        enrollmentIntent.clear();
        
        if (isEnrolled) {
          toast({
            title: "Already Enrolled",
            description: "You're already enrolled in this course!",
          });
          return;
        }

        if (!course.price || course.price === 0) {
          try {
            const { error } = await supabase
              .from('enrollments')
              .insert({
                student_id: user.id,
                course_id: courseId,
              });

            if (error) throw error;
            
            toast({
              title: "Success",
              description: "Successfully enrolled in this free course!",
            });
            setIsEnrolled(true);
          } catch (error: any) {
            console.error('Auto-enrollment error:', error);
            toast({
              title: "Error",
              description: "Failed to enroll. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          setShowPaymentDialog(true);
        }
      }
    };

    if (course && user !== undefined) {
      handlePendingEnrollment();
    }
  }, [course, user, courseId, isEnrolled]);

  const fetchCourseDetails = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("status", "published")
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

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
      .select("id, status, payment_verified, progress")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    setIsEnrolled(!!data);
    setEnrollmentStatus(data?.status || null);
    setEnrollmentProgress(data?.progress || 0);
  };

  const handleEnroll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!course?.price || course.price === 0) {
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
    } else {
      setShowPaymentDialog(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Account details copied to clipboard",
    });
  };

  const handlePhysicalEnrollment = async () => {
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
          status: 'pending',
          payment_verified: false,
        });

      if (error) throw error;

      toast({
        title: "Enrollment Submitted",
        description: "Your physical student enrollment has been submitted and is awaiting admin approval.",
      });

      setShowPhysicalDialog(false);
      setShowPhysicalPaymentDialog(false);
      
      checkEnrollment();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLessonClick = async (lesson: Lesson) => {
    if (enrollmentStatus === "pending" && !lesson.is_free) {
      toast({
        title: "Pending Approval",
        description: "Your enrollment is awaiting admin approval. You can only access free lessons for now.",
        variant: "destructive",
      });
      return;
    }

    if (!lesson.is_free && !isEnrolled) {
      toast({
        title: "Locked",
        description: "Please enroll to access this lesson",
        variant: "destructive",
      });
      return;
    }
    setSelectedLesson(lesson);
    
    if (isEnrolled) {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("lesson_id", lesson.id)
        .maybeSingle();
      
      if (!error && data) {
        setLessonAssignment(data);
      } else {
        setLessonAssignment(null);
      }
    }
  };

  const currentVideo = selectedLesson?.video_url || course?.video_url;
  const currentVideoTitle = selectedLesson ? selectedLesson.title : course?.title;
  const currentVideoDescription = selectedLesson ? selectedLesson.description : course?.short_description;

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <InstructorSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger />
            </header>
            <main className="flex-1 p-6">
              <div className="text-center">Loading...</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!course) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <InstructorSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger />
            </header>
            <main className="flex-1 p-6">
              <div className="text-center">Course not found</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <Button variant="ghost" onClick={() => navigate("/instructor/enroll")}>
              ← Back to Courses
            </Button>
          </header>

          <main className="flex-1 p-6">
            {isEnrolled && enrollmentProgress === 100 && (
              <Card className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="h-10 w-10 text-green-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                          🎉 Congratulations! You've completed this course
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          You can now request your certificate
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate("/instructor/certificates")}
                      variant="default"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      View Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
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
                        <p className="text-muted-foreground mb-4">{currentVideoDescription}</p>
                      )}
                      
                      {lessonAssignment && isEnrolled && (
                        <Button 
                          onClick={() => navigate(`/instructor/assignments?lesson=${selectedLesson.id}`)}
                          className="w-full"
                          variant="outline"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Assignment
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                    
                    {!isEnrolled && enrollmentStatus !== "pending" && (
                      <div className="mt-6 rounded-lg border p-4">
                        <div className="mb-4">
                          <p className="text-2xl font-bold">${course.price || "Free"}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.price && course.price > 0 ? "Choose your enrollment type" : "Free enrollment"}
                          </p>
                        </div>
                        
                        {course.price && course.price > 0 ? (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              size="lg" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => setShowPhysicalDialog(true)}
                            >
                              <Building2 className="mr-2 h-4 w-4" />
                              Enroll as Physical Student
                            </Button>
                            
                            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="lg" 
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Enroll as Online Student
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Complete Your Enrollment</DialogTitle>
                                </DialogHeader>
                                <PaymentForm 
                                  courseId={courseId!}
                                  amount={course.price}
                                  currency="USD"
                                  onSuccess={() => {
                                    setShowPaymentDialog(false);
                                    checkEnrollment();
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        ) : (
                          <Button onClick={handleEnroll} className="w-full">Enroll Now</Button>
                        )}
                      </div>
                    )}
                    {enrollmentStatus === "pending" && (
                      <div className="mt-6 rounded-lg border border-orange-500 bg-orange-500/10 p-4">
                        <p className="font-semibold text-orange-600">⏳ Enrollment Pending</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your enrollment is awaiting admin approval. You can access free lessons only.
                        </p>
                      </div>
                    )}
                    {isEnrolled && enrollmentStatus === "active" && (
                      <div className="mt-6 rounded-lg border border-green-500 bg-green-500/10 p-4 text-center">
                        <p className="font-semibold text-green-600">✓ Enrolled</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

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
                                const canAccess = lesson.is_free || (isEnrolled && enrollmentStatus === "active");
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

            {selectedLesson && isEnrolled && course && (
              <CourseVideoChat
                courseTitle={course.title}
                lessonTitle={selectedLesson.title}
                courseDescription={course.description}
              />
            )}

            <Dialog open={showPhysicalDialog} onOpenChange={setShowPhysicalDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">Physical Student Enrollment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Physical Student Enrollment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="account" className="text-right">
                      Account Number
                    </label>
                    <input
                      type="text"
                      id="account"
                      value="1234567890"
                      readOnly
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("1234567890")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="bank" className="text-right">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bank"
                      value="Sample Bank"
                      readOnly
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="branch" className="text-right">
                      Branch
                    </label>
                    <input
                      type="text"
                      id="branch"
                      value="Sample Branch"
                      readOnly
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="location" className="text-right">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value="Sample Location"
                      readOnly
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("Sample Location")}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                  <p className="text-sm text-muted-foreground">
                    Please make a payment to the above account details and then click on the button below to submit your enrollment request.
                  </p>
                </div>
                <CardFooter>
                  <Button onClick={() => {
                    setShowPhysicalDialog(false);
                    setShowPhysicalPaymentDialog(true);
                  }}>
                    I have made the payment
                  </Button>
                </CardFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showPhysicalPaymentDialog} onOpenChange={setShowPhysicalPaymentDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Confirm Payment</DialogTitle>
                  <DialogDescription>
                    Please upload a screenshot of your payment receipt.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="receipt" className="text-right">
                      Payment Receipt
                    </label>
                    <input
                      type="file"
                      id="receipt"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <CardFooter>
                  <Button onClick={handlePhysicalEnrollment}>
                    Submit Enrollment
                  </Button>
                </CardFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CourseDetail;
