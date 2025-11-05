// Exact copy of admin Messages but with InstructorSidebar
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { NewMessageDialog } from "@/components/NewMessageDialog";

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      const channel = supabase.channel('instructor-messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
        if (selectedUserId) fetchMessages(selectedUserId);
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [currentUserId, selectedUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "instructor").maybeSingle();
    if (!roles) { toast.error("Access denied"); navigate("/student"); return; }
    setCurrentUserId(session.user.id);
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;
    const { data } = await supabase.from("messages").select("*").or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`).order("created_at", { ascending: false });
    const userIds = new Set<string>();
    data?.forEach((msg) => userIds.add(msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id));
    const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", Array.from(userIds));
    const convMap = new Map();
    data?.forEach((msg) => {
      const otherUserId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
      const otherUser = profiles?.find(p => p.id === otherUserId);
      if (!convMap.has(otherUserId) && otherUser) {
        convMap.set(otherUserId, { userId: otherUserId, userName: `${otherUser.first_name} ${otherUser.last_name}`, lastMessage: msg.content, lastMessageAt: msg.created_at, unreadCount: 0 });
      }
      if (msg.recipient_id === currentUserId && !msg.read) {
        const conv = convMap.get(otherUserId);
        if (conv) conv.unreadCount++;
      }
    });
    setConversations(Array.from(convMap.values()));
  };

  const fetchMessages = async (userId: string) => {
    if (!currentUserId) return;
    const { data } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`).order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ read: true }).eq("recipient_id", currentUserId).eq("sender_id", userId).eq("read", false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !currentUserId) return;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id: selectedUserId, content: newMessage, read: false });
    setNewMessage("");
    fetchMessages(selectedUserId);
    fetchConversations();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Messages</h1>
            </div>
            <Button onClick={() => setShowNewMessageDialog(true)}><Plus className="mr-2 h-4 w-4" />New Message</Button>
          </header>
          <main className="flex-1 flex p-6 gap-4">
            <div className="w-96 border-r bg-muted/20 rounded-lg overflow-hidden">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <div className="font-semibold">No conversations yet</div>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.userId} onClick={() => { setSelectedUserId(conv.userId); fetchMessages(conv.userId); }} className={`p-4 border-b cursor-pointer hover:bg-accent ${selectedUserId === conv.userId ? 'bg-accent' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{conv.userName}</span>
                      {conv.unreadCount > 0 && <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">{conv.unreadCount}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex-1 flex flex-col bg-background rounded-lg border">
              {selectedUserId ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_id === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">{format(new Date(msg.created_at), 'hh:mm a')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                    <Button onClick={handleSendMessage} size="icon" className="self-end"><Send className="h-4 w-4" /></Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center"><MessageSquare className="h-24 w-24 text-muted-foreground" /></div>
              )}
            </div>
          </main>
        </div>
      </div>
      <NewMessageDialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog} onMessageSent={fetchConversations} />
    </SidebarProvider>
  );
}
