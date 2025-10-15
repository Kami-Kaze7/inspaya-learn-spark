import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";

const Certificates = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="mt-2 text-muted-foreground">View your earned certificates</p>
      </main>
    </div>
  );
};

export default Certificates;
