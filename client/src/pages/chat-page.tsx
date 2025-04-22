import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatMessage, UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocketContext } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  UserIcon, 
  Send, 
  Loader2, 
  MessageSquare, 
  ChevronLeft, 
  Menu, 
  UserPlus,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type Conversation = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone: string | null;
  unreadCount: number;
};

type AvailableUser = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone: string | null;
  businessName: string | null;
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { socket, connected } = useWebSocketContext();

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/chat/conversations"],
    throwOnError: true,
  });

  // Fetch messages with selected user
  const { data: messages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/messages/${selectedUser}`],
    enabled: !!selectedUser,
    throwOnError: true,
  });
  
  // Fetch available users for new chats (only when dialog is open)
  const { data: availableUsers, isLoading: availableUsersLoading } = useQuery<AvailableUser[]>({
    queryKey: ["/api/chat/available-users"],
    enabled: newChatOpen,
    throwOnError: true,
  });

  // Mutation to send a message via REST API
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      const response = await apiRequest("POST", "/api/chat/messages", data);
      return response.json();
    },
    onSuccess: () => {
      // Clear message input
      setMessage("");
      // Invalidate queries to refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages/${selectedUser}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  // Socket event handler for incoming messages
  useEffect(() => {
    if (!socket || !connected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle new message events
        if (data.type === "new_message") {
          // If we're in the conversation with the sender, invalidate messages
          if (selectedUser === data.senderId) {
            queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedUser] });
          }
          
          // Always invalidate conversations to update unread count
          queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
          
          // Show toast notification if not in the conversation
          if (selectedUser !== data.senderId) {
            toast({
              title: `New message from ${data.senderName}`,
              description: data.content.length > 50 ? `${data.content.substring(0, 50)}...` : data.content,
            });
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, connected, selectedUser, queryClient, toast]);

  // Function to send a message
  const handleSendMessage = () => {
    if (!user || !selectedUser || !message.trim()) return;

    // Option 1: Send via REST API
    sendMessageMutation.mutate({
      receiverId: selectedUser,
      content: message,
    });

    // Option 2: Send via WebSocket for real-time delivery
    // Commented out as we're using the REST API for sending
    /*
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: "chat_message",
        receiverId: selectedUser,
        content: message,
      }));
      setMessage("");
    }
    */
  };

  // Handle key press in text area
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role display text
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "collector":
        return "Waste Collector";
      case "recycler":
        return "Recycler";
      case "household":
        return "Household";
      case "organization":
        return "Organization";
      default:
        return role;
    }
  };

  // State to handle the mobile conversation drawer
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Function to handle user selection and close drawer on mobile
  const handleSelectUser = (userId: number) => {
    setSelectedUser(userId);
    setMobileDrawerOpen(false);
  }

  // Function to go back to conversation list on mobile
  const handleBackToList = () => {
    setSelectedUser(null);
  }
  
  // Function to start a new chat with a user
  const handleStartChat = (userId: number) => {
    setSelectedUser(userId);
    setNewChatOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Select a user to start a new conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {availableUsersLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availableUsers?.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                <p>No users available to chat with based on your role.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {availableUsers?.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartChat(user.id)}
                    className="flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors hover:bg-accent border border-border"
                  >
                    <Avatar className="h-10 w-10 border border-muted">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(user.fullName || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {user.fullName || user.username}
                        {user.businessName && <span className="ml-1 text-muted-foreground">({user.businessName})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleDisplay(user.role)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop layout */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border-none shadow-md">
          <div className="grid grid-cols-3 min-h-[calc(100vh-180px)]">
            {/* Conversations Panel - Desktop */}
            <div className="col-span-1 border-r border-border h-full flex flex-col">
              <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Conversations</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Chat with waste collectors, recyclers, and other users
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setNewChatOpen(true)} 
                  size="sm" 
                  className="h-8 px-2"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </CardHeader>
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : conversations?.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <div className="mb-4">
                      <UserIcon className="h-12 w-12 text-muted-foreground/25 mx-auto" />
                    </div>
                    <p className="font-medium mb-1">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your chat conversations will appear here
                    </p>
                    <Button 
                      onClick={() => setNewChatOpen(true)} 
                      className="mt-4"
                      variant="outline"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Start a new conversation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations?.map((convo) => (
                      <div
                        key={convo.id}
                        onClick={() => setSelectedUser(convo.id)}
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors
                          ${
                            selectedUser === convo.id
                              ? "bg-primary/10 hover:bg-primary/15"
                              : "hover:bg-accent"
                          }
                        `}
                      >
                        <Avatar className="h-10 w-10 border border-muted">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(convo.fullName || convo.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center w-full">
                            <p className="font-medium truncate">
                              {convo.fullName || convo.username}
                            </p>
                            {convo.unreadCount > 0 && (
                              <Badge variant="secondary" className="ml-2 bg-primary text-white">
                                {convo.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getRoleDisplay(convo.role)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Panel - Desktop */}
            <div className="col-span-2 h-full flex flex-col bg-gray-50/50">
              {!selectedUser ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-white p-8 rounded-lg shadow-sm max-w-md mx-auto">
                    <UserIcon className="h-16 w-16 text-muted-foreground/40 mb-4 mx-auto" />
                    <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to start chatting.
                      Connect with waste collectors, recyclers, and other users.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <CardHeader className="px-6 py-4 border-b">
                    <div className="flex items-center">
                      <Avatar className="h-9 w-9 mr-2">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(
                            conversations?.find((c) => c.id === selectedUser)?.fullName || ""
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {conversations?.find((c) => c.id === selectedUser)?.fullName || "User"}
                        </CardTitle>
                        <CardDescription>
                          {getRoleDisplay(
                            conversations?.find((c) => c.id === selectedUser)?.role || ""
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Chat Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
                          <div className="text-center mb-4">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Start a conversation by sending a message below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages?.map((msg) => {
                          const isMe = msg.senderId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                                  isMe
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-white border border-gray-100"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isMe
                                      ? "text-primary-foreground/80"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {msg.timestamp 
                                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }) 
                                    : "Just now"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <CardFooter className="p-4 pt-3 border-t bg-white">
                    <div className="flex items-end w-full gap-2">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[60px] max-h-32 rounded-lg border-gray-200 focus:border-primary"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                        className="h-12 px-4"
                        size="icon"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="sr-only">Send</span>
                      </Button>
                    </div>
                  </CardFooter>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Card className="overflow-hidden border-none shadow-md">
          {!selectedUser ? (
            // Conversation list view (mobile)
            <div className="flex flex-col h-[calc(100vh-130px)]">
              <CardHeader className="px-4 py-3 border-b">
                <CardTitle className="text-lg font-bold">Conversations</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Chat with waste collectors, recyclers, and other users
                </CardDescription>
              </CardHeader>
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : conversations?.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <div className="mb-4">
                      <UserIcon className="h-12 w-12 text-muted-foreground/25 mx-auto" />
                    </div>
                    <p className="font-medium mb-1">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your chat conversations will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations?.map((convo) => (
                      <div
                        key={convo.id}
                        onClick={() => handleSelectUser(convo.id)}
                        className="flex items-center gap-3 p-3 border-b border-border cursor-pointer"
                      >
                        <Avatar className="h-12 w-12 border border-muted">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(convo.fullName || convo.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center w-full">
                            <p className="font-medium truncate">
                              {convo.fullName || convo.username}
                            </p>
                            {convo.unreadCount > 0 && (
                              <Badge variant="secondary" className="ml-2 bg-primary text-white">
                                {convo.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getRoleDisplay(convo.role)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            // Individual chat view (mobile)
            <div className="flex flex-col h-[calc(100vh-130px)]">
              {/* Chat Header with Back Button */}
              <CardHeader className="px-4 py-3 border-b flex flex-row items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToList}
                  className="mr-2 h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center">
                  <Avatar className="h-9 w-9 mr-2">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(
                        conversations?.find((c) => c.id === selectedUser)?.fullName || ""
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {conversations?.find((c) => c.id === selectedUser)?.fullName || "User"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {getRoleDisplay(
                        conversations?.find((c) => c.id === selectedUser)?.role || ""
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4 bg-gray-50/50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="bg-white rounded-lg shadow-sm p-6 mx-auto">
                      <div className="text-center mb-4">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a conversation by sending a message below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages?.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-white border border-gray-100"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isMe
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {msg.timestamp 
                                ? new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }) 
                                : "Just now"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <CardFooter className="p-3 border-t bg-white">
                <div className="flex items-end w-full gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[50px] max-h-32 rounded-lg border-gray-200 focus:border-primary"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="h-10 w-10"
                    size="icon"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;