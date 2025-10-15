import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, CheckCircle2, Clock, Trophy, Upload, Info } from "lucide-react";

const Assignments = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-primary">Assignments</h1>
          <p className="text-muted-foreground">Submit your coursework and track your academic progress</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <TrendingUp className="mb-3 h-12 w-12 text-primary" />
              <p className="mb-1 text-sm text-muted-foreground">Average Grade</p>
              <p className="text-3xl font-bold text-primary">0%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-green-600" />
              <p className="mb-1 text-sm text-muted-foreground">Submitted</p>
              <p className="text-3xl font-bold text-green-600">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Clock className="mb-3 h-12 w-12 text-yellow-600" />
              <p className="mb-1 text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Trophy className="mb-3 h-12 w-12 text-blue-600" />
              <p className="mb-1 text-sm text-muted-foreground">Best Grade</p>
              <p className="text-3xl font-bold text-blue-600">0%</p>
            </CardContent>
          </Card>
        </div>

        {/* Submit New Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Submit New Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input id="title" placeholder="e.g., Module 3 Final Project" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select>
                    <SelectTrigger id="course">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course1">Course 1</SelectItem>
                      <SelectItem value="course2">Course 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Assignment Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of your submission..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Upload Files</Label>
                  <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto mb-4 h-12 w-12 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here or click to browse
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Submission Notes</Label>
                  <Card className="bg-blue-50 dark:bg-blue-950/30">
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">Tips:</p>
                          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            <li>• Submit before deadline</li>
                            <li>• Check file format requirements</li>
                            <li>• Include all required documents</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button type="submit">Submit Assignment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Assignments;
