import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Video, ArrowRight } from "lucide-react";
import { useState } from "react";

const Enroll = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="mb-2 text-3xl font-bold text-primary">Browse Available Courses</h1>
        
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Browse Courses by Category</CardTitle>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Courses</TabsTrigger>
                <TabsTrigger value="ai">AI Courses</TabsTrigger>
                <TabsTrigger value="motion">Motion Graphics</TabsTrigger>
                <TabsTrigger value="video">Video Editing</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Sample Course Card */}
                  <Card className="overflow-hidden">
                    <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">AI COURSES</CardTitle>
                      <CardDescription>by Admin User</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="destructive" className="mb-2">AI Courses</Badge>
                      <Badge variant="secondary" className="ml-2">advanced</Badge>
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span>6h 45m</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">$45.00</span>
                      <Button size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Add more course cards as needed */}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Enroll;
