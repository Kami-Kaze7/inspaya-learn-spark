import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";

const Courses = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="mb-2 text-3xl font-bold text-primary">My Registered Courses</h1>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Total Courses Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="mb-4 h-16 w-16 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">No Registered Courses</h3>
                      <p className="text-sm text-muted-foreground">
                        Enroll in courses to see them here
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Courses;
