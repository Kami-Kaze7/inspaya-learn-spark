import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Megaphone, User, Calendar } from "lucide-react";

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-primary">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with the latest announcements and important information</p>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>Recent Announcements</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <span className="mr-2">✓</span>
                Mark All Read
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sample Announcement */}
            <Card className="relative border-l-4 border-l-yellow-500 bg-primary/10">
              <Badge className="absolute right-4 top-4 bg-green-500">NEW</Badge>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500">
                    <Megaphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">HIGH</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">Jul 23</span>
                    <h3 className="mb-2 text-lg font-bold">hello students welcome back to the new year</h3>
                    <p className="text-muted-foreground">hello all students and welcome back</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>null null</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Jul 23, 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    <span className="mr-2">✓</span>
                    Mark Read
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
