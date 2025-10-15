import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";

const Assignments = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="mt-2 text-muted-foreground">View and submit your assignments</p>
      </main>
    </div>
  );
};

export default Assignments;
