import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import PublicCourseDetail from "./pages/PublicCourseDetail";
import CoursesLanding from "./pages/CoursesLanding";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Students from "./pages/admin/Students";
import Instructors from "./pages/admin/Instructors";
import Courses from "./pages/admin/Courses";
import Enrollments from "./pages/admin/Enrollments";
import Announcements from "./pages/admin/Announcements";
import Messages from "./pages/admin/Messages";
import Assignments from "./pages/admin/Assignments";
import AdminCertificates from "./pages/admin/Certificates";
import StudentCourses from "./pages/student/Courses";
import StudentCertificates from "./pages/student/Certificates";
import StudentEnroll from "./pages/student/Enroll";
import StudentCourseDetail from "./pages/student/CourseDetail";
import StudentNotifications from "./pages/student/Notifications";
import StudentAssignments from "./pages/student/Assignments";
import StudentMessages from "./pages/student/Messages";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import NotFound from "./pages/NotFound";
import StudentWorks from "./pages/StudentWorks";
import AdminProjects from "./pages/admin/Projects";
import StudentProjects from "./pages/student/Projects";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/courses" element={<CoursesLanding />} />
          <Route path="/course/:courseId" element={<PublicCourseDetail />} />
          <Route path="/student-works" element={<StudentWorks />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
          <Route path="/student/enroll" element={<StudentEnroll />} />
          <Route path="/student/course/:courseId" element={<StudentCourseDetail />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/projects" element={<StudentProjects />} />
          <Route path="/student/messages" element={<StudentMessages />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/instructors" element={<Instructors />} />
          <Route path="/admin/courses" element={<Courses />} />
          <Route path="/admin/enrollments" element={<Enrollments />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/messages" element={<Messages />} />
          <Route path="/admin/assignments" element={<Assignments />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
