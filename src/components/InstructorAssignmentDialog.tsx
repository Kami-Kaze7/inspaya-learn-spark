import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, UserMinus, UserPlus, Search } from "lucide-react";

interface InstructorAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  courseOwnerId: string;
}

interface Instructor {
  id: string;
  full_name: string;
  email: string;
}

interface Assignment {
  id: string;
  instructor_id: string;
  instructor?: {
    full_name: string;
    email: string;
  };
}

export function InstructorAssignmentDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  courseOwnerId,
}: InstructorAssignmentDialogProps) {
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseOwner, setCourseOwner] = useState<Instructor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, courseId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAllInstructors(),
      fetchAssignments(),
      fetchCourseOwner(),
    ]);
    setLoading(false);
  };

  const fetchAllInstructors = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "instructor");

    if (!roles) return;

    const instructorIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", instructorIds);

    setAllInstructors(profiles || []);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from("course_instructors")
      .select(`
        id,
        instructor_id,
        profiles:instructor_id (
          full_name,
          email
        )
      `)
      .eq("course_id", courseId);

    setAssignments(data || []);
  };

  const fetchCourseOwner = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", courseOwnerId)
      .single();

    setCourseOwner(data);
  };

  const handleAssign = async (instructorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("course_instructors")
      .insert({
        course_id: courseId,
        instructor_id: instructorId,
        assigned_by: session.user.id,
      });

    if (error) {
      toast.error("Failed to assign instructor");
      return;
    }

    toast.success("Instructor assigned successfully");
    fetchAssignments();
  };

  const handleRemove = async (assignmentId: string) => {
    const { error } = await supabase
      .from("course_instructors")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error("Failed to remove instructor");
      return;
    }

    toast.success("Instructor removed successfully");
    fetchAssignments();
  };

  const assignedInstructorIds = assignments.map((a) => a.instructor_id);
  const availableInstructors = allInstructors.filter(
    (instructor) =>
      !assignedInstructorIds.includes(instructor.id) &&
      instructor.id !== courseOwnerId &&
      (instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Instructors - {courseTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Owner */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Course Owner
            </h3>
            {courseOwner && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{courseOwner.full_name}</p>
                  <p className="text-sm text-muted-foreground">{courseOwner.email}</p>
                </div>
                <Badge>Owner</Badge>
              </div>
            )}
          </div>

          {/* Assigned Instructors */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Assigned Instructors ({assignments.length})
            </h3>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                No instructors assigned yet
              </p>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {assignment.instructor?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.instructor?.email || ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(assignment.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Instructors */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Assign Instructors</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search instructors by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground p-3">Loading...</p>
            ) : availableInstructors.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                No available instructors found
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{instructor.full_name}</p>
                      <p className="text-sm text-muted-foreground">{instructor.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(instructor.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
