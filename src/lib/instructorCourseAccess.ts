import { supabase } from "@/integrations/supabase/client";

/**
 * Get all course IDs that an instructor has access to
 * This includes both courses they own and courses they've been assigned to
 */
export async function getInstructorCourseIds(userId: string): Promise<string[]> {
  // Get courses owned by instructor
  const { data: ownedCourses } = await supabase
    .from("courses")
    .select("id")
    .eq("instructor_id", userId);

  // Get courses assigned to instructor
  const { data: assignedCourses } = await supabase
    .from("course_instructors")
    .select("course_id")
    .eq("instructor_id", userId);

  // Combine and deduplicate
  const ownedIds = ownedCourses?.map(c => c.id) || [];
  const assignedIds = assignedCourses?.map(c => c.course_id) || [];
  
  return [...new Set([...ownedIds, ...assignedIds])];
}
