import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Clock, DollarSign, Globe, Award, Users, PlayCircle, Building2, UsersRound, Handshake, Check, MapPin, Copy, CreditCard, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { enrollmentIntent } from "@/lib/enrollmentIntent";

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
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [showPhysicalDialog, setShowPhysicalDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Helper function to check if URL is YouTube
  const isYouTubeUrl = (url: string) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Calculate video data - must be at top level before any early returns
  const videoData = useMemo(() => {
    if (!course) {
      return { type: 'none', url: null, videoId: null };
    }
    
    const firstModule = modules[0];
    const firstLesson = firstModule && lessons[firstModule.id] && lessons[firstModule.id].length > 0 
      ? lessons[firstModule.id][0] 
      : null;
    
    const videoUrl = course.video_url || firstLesson?.video_url;
    
    if (!videoUrl) {
      return { type: 'none', url: null, videoId: null };
    }
    
    if (isYouTubeUrl(videoUrl)) {
      const extractedId = getYouTubeVideoId(videoUrl);
      return { type: 'youtube', url: videoUrl, videoId: extractedId };
    }
    
    return { type: 'direct', url: videoUrl, videoId: null };
  }, [course, modules, lessons]);

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


  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleContinueToPayment = () => {
    setShowPhysicalDialog(false);
    setShowPaymentDialog(true);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Inspaya
          </Link>
          <Button onClick={() => {
            if (courseId) enrollmentIntent.set(courseId);
            navigate("/auth");
          }}>Enroll Now</Button>
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

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  onClick={() => setShowPhysicalDialog(true)}
                >
                  Enroll as Physical Student
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    if (courseId) enrollmentIntent.set(courseId);
                    navigate("/auth");
                  }}
                >
                  Enroll as Online Student
                </Button>
              </div>
            </div>

            {/* Video Preview */}
            <div>
              {videoData.type === 'youtube' && videoData.videoId ? (
                <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoData.videoId}`}
                    title={course.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : videoData.type === 'direct' && videoData.url ? (
                <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
                  <video
                    controls
                    className="w-full h-full"
                    poster={course.thumbnail_url}
                  >
                    <source src={videoData.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : course.thumbnail_url ? (
                <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-muted">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
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
              <CardContent className="pt-0 space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setShowPhysicalDialog(true)}
                >
                  Enroll as Physical Student
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    if (courseId) enrollmentIntent.set(courseId);
                    navigate("/auth");
                  }}
                >
                  Enroll as Online Student
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Physical Learning Centers Dialog */}
      <Dialog open={showPhysicalDialog} onOpenChange={setShowPhysicalDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-primary" />
              Physical Learning Centers
            </DialogTitle>
          </DialogHeader>

          {/* Feature Icons */}
          <div className="grid grid-cols-3 gap-4 py-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">State-of-the-Art Facilities</h3>
              <p className="text-xs text-muted-foreground">Modern classrooms and equipment</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
                <UsersRound className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm">Expert Instructors</h3>
              <p className="text-xs text-muted-foreground">Hands-on guidance from professionals</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Handshake className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-sm">Networking Opportunities</h3>
              <p className="text-xs text-muted-foreground">Connect with fellow learners</p>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">About Our Physical Centers</h4>
                <p className="text-sm text-muted-foreground">
                  Our physical learning centers provide an immersive, hands-on learning experience with state-of-the-art facilities, expert instructors, and a collaborative environment. Students benefit from direct interaction with instructors, access to specialized equipment, and networking opportunities with peers.
                </p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* What You'll Get */}
            <div>
              <h4 className="font-semibold mb-3">What You'll Get:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Access to modern learning facilities</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Direct instructor guidance and support</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Hands-on practical experience</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Networking with industry professionals</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Structured learning schedule</span>
                </div>
              </div>
            </div>

            {/* Center Locations */}
            <div>
              <h4 className="font-semibold mb-3">Center Locations:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">Lagos Main Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">Abuja Learning Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">Port Harcourt Campus</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">Kano Training Center</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPhysicalDialog(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleContinueToPayment}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Details
            </DialogTitle>
          </DialogHeader>

          {/* Bank Transfer Instructions */}
          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Bank Transfer Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  Please make a bank transfer to the account details below to complete your physical student enrollment.
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Account Number */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 p-2 bg-muted rounded border">
                    <span className="font-mono font-semibold">1215690464</span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard("1215690464", "Account number")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 p-2 bg-muted rounded border">
                    <span className="font-semibold">Crisp TV</span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard("Crisp TV", "Account name")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 p-2 bg-muted rounded border">
                  <span className="font-semibold">Zenith Bank</span>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard("Zenith Bank", "Bank name")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-2">Important</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Please include your full name and course title in the transfer description</li>
                  <li>Keep your transfer receipt for verification</li>
                  <li>Payment verification may take 1-2 business days</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>After making a transfer, click on proceed to continue with your enrollment.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPaymentDialog(false);
                localStorage.removeItem("pending_enrollment");
              }}
            >
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                localStorage.setItem("pending_enrollment", JSON.stringify({
                  courseId,
                  enrollmentType: "physical"
                }));
                navigate("/auth");
              }}
            >
              Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicCourseDetail;
