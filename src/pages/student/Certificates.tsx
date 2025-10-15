import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

const Certificates = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="mb-2 text-3xl font-bold text-primary">Certificates</h1>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Awarded Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <Award className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Certificates Yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete courses to earn certificates and showcase your achievements
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Certificates;
