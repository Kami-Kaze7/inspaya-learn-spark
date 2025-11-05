import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, PlayCircle, Clock, BookOpen, FileText, Award, Building2, UsersRound, Handshake, Check, MapPin, Copy, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/PaymentForm";
import { enrollmentIntent } from "@/lib/enrollmentIntent";
import { CourseVideoChat } from "@/components/CourseVideoChat";

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

  // Handle pending enrollment after signup
  useEffect(() => {
    const handlePendingEnrollment = async () => {
      const pendingCourseId = enrollmentIntent.get();
      
      if (pendingCourseId && pendingCourseId === courseId && course && user) {
        // Clear the intent first
        enrollmentIntent.clear();
        
        // Check if already enrolled
        if (isEnrolled) {
          toast({
            title: "Already Enrolled",
            description: "You're already enrolled in this course!",
          });
          return;
        }

        // For free courses, auto-enroll
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
          // For paid courses, auto-open payment dialog
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

    // If course is free (price is 0 or null), enroll directly
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
      // If course is paid, show payment dialog
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
      // Create pending enrollment for physical student
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

      // Close dialogs
      setShowPhysicalDialog(false);
      setShowPhysicalPaymentDialog(false);
      
      // Refresh enrollment status
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
    // If enrollment is pending, only allow access to free lessons
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
    
    // Check if this lesson has an assignment
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

        {/* Course Completion Banner */}
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
                  onClick={() => navigate("/student/certificates")}
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
                    <p className="text-muted-foreground mb-4">{currentVideoDescription}</p>
                  )}
                  
                  {/* Assignment Button */}
                  {lessonAssignment && isEnrolled && (
                    <Button 
                      onClick={() => navigate(`/student/assignments?lesson=${selectedLesson.id}`)}
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
                        {/* Physical Student Enrollment Button */}
                        <Button 
                          size="lg" 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setShowPhysicalDialog(true)}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Enroll as Physical Student
                        </Button>
                        
                        {/* Online Student Enrollment Button */}
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

        {/* AI Chat Assistant - appears when viewing a lesson */}
        {selectedLesson && isEnrolled && course && (
          <CourseVideoChat
            courseTitle={course.title}
            lessonTitle={selectedLesson.title}
            courseDescription={course.description}
          />
        )}

        {/* Physical Learning Centers Dialog */}
        <Dialog open={showPhysicalDialog} onOpenChange={setShowPhysicalDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-green-600" />
                Physical Learning Centers
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Join our vibrant learning community at one of our physical centers across Nigeria!
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-green-500/20">
                  <CardContent className="pt-6">
                    <Building2 className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="font-semibold mb-2">Modern Facilities</h3>
                    <p className="text-sm text-muted-foreground">
                      State-of-the-art learning spaces with high-speed internet and equipment
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-500/20">
                  <CardContent className="pt-6">
                    <UsersRound className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="font-semibold mb-2">Live Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      In-person instruction with experienced educators and peer collaboration
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-500/20">
                  <CardContent className="pt-6">
                    <Handshake className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="font-semibold mb-2">Networking</h3>
                    <p className="text-sm text-muted-foreground">
                      Build connections with fellow students and industry professionals
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Our Locations
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span><strong>Lagos Center:</strong> Victoria Island, Lagos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span><strong>Abuja Center:</strong> Central Business District, Abuja</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span><strong>Port Harcourt Center:</strong> GRA Phase 2, Port Harcourt</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => {
                  setShowPhysicalDialog(false);
                  setShowPhysicalPaymentDialog(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Details Dialog */}
        <Dialog open={showPhysicalPaymentDialog} onOpenChange={setShowPhysicalPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Bank Transfer Instructions</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Please make your payment to the account below and your enrollment will be activated upon verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Name</p>
                    <p className="font-semibold">First Bank of Nigeria</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("First Bank of Nigeria")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-semibold">1234567890</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("1234567890")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-semibold">Inspaya Learning Platform</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("Inspaya Learning Platform")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">${course?.price}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(course?.price?.toString() || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPhysicalPaymentDialog(false);
                    setShowPhysicalDialog(true);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePhysicalEnrollment}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Proceed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default CourseDetail;
