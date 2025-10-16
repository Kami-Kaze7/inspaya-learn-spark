import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { NewMessageDialog } from "@/components/NewMessageDialog";

interface Message {
  id: string;
  content: string;
  subject: string | null;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
  recipient?: {
    first_name: string;
    last_name: string;
  };
}

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      
      const channel = supabase
        .channel('admin-messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => {
            fetchConversations();
            if (selectedUserId) {
              fetchMessages(selectedUserId);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, selectedUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/student");
      return;
    }

    setCurrentUserId(session.user.id);
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;

    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = new Set<string>();
      messagesData?.forEach((message) => {
        const otherUserId = message.sender_id === currentUserId 
          ? message.recipient_id 
          : message.sender_id;
        userIds.add(otherUserId);
      });

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const conversationMap = new Map<string, Conversation>();

      messagesData?.forEach((message) => {
        const otherUserId = message.sender_id === currentUserId 
          ? message.recipient_id 
          : message.sender_id;
        
        const otherUser = profileMap.get(otherUserId);

        if (!conversationMap.has(otherUserId) && otherUser) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName: `${otherUser.first_name} ${otherUser.last_name}`,
            lastMessage: message.content,
            lastMessageAt: message.created_at,
            unreadCount: 0,
          });
        }

        if (message.recipient_id === currentUserId && !message.read) {
          const conv = conversationMap.get(otherUserId);
          if (conv) conv.unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    }
  };

  const fetchMessages = async (userId: string) => {
    if (!currentUserId) return;

    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", [currentUserId, userId]);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedMessages: Message[] = messagesData?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id),
        recipient: profileMap.get(msg.recipient_id),
      })) || [];

      setMessages(enrichedMessages);

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("recipient_id", currentUserId)
        .eq("sender_id", userId)
        .eq("read", false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessages(userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !currentUserId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedUserId,
          content: newMessage,
          read: false,
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedUserId);
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  Communicate directly with students and tutors
                </p>
              </div>
            </div>
            <Button onClick={() => setShowNewMessageDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </header>

          <main className="flex-1 flex p-6 gap-4">
            <div className="w-96 border-r bg-muted/20 rounded-lg overflow-hidden">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <div className="font-semibold">No conversations yet</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Start a conversation to begin messaging
                  </div>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.userId}
                    onClick={() => handleSelectConversation(conv.userId)}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedUserId === conv.userId ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{conv.userName}</span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conv.lastMessageAt), 'MMM dd, hh:mm a')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex-1 flex flex-col bg-background rounded-lg border">
              {selectedUserId ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === currentUserId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {format(new Date(message.created_at), 'hh:mm a')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} size="icon" className="self-end">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <MessageSquare className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                    <div className="text-xl font-semibold mb-2">Select a conversation</div>
                    <div className="text-sm text-muted-foreground">
                      Choose a conversation from the list to start messaging
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        onMessageSent={() => {
          fetchConversations();
        }}
      />
    </SidebarProvider>
  );
}
