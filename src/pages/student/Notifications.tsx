import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-muted-foreground">View your notifications</p>
      </main>
    </div>
  );
};

export default Notifications;
