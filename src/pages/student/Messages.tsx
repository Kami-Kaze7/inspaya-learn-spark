import { StudentHeader } from "@/components/StudentHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

const Messages = () => {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <StudentSidebar />
      <main className="ml-64 mt-[73px] p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-primary">Messages</h1>
            <p className="text-muted-foreground">Communicate with admins and tutors</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>

        <div className="grid h-[600px] grid-cols-3 gap-4">
          {/* Conversations List */}
          <Card className="col-span-1">
            <CardContent className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No conversations yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start a conversation to begin messaging
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Message Area */}
          <Card className="col-span-2">
            <CardContent className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Messages;
