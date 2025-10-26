import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, Loader2, MessageSquare, User, Stethoscope } from "lucide-react";
import { format } from "date-fns";
export default function ConsultationChat({ userRole }) {
    const params = useParams();
    const consultationId = params.id;
    const [, setLocation] = useLocation();
    const { uid } = useWallet();
    const { toast } = useToast();
    const [message, setMessage] = useState("");
    const scrollRef = useRef(null);
    const { data: consultation, isLoading: loadingConsultation } = useQuery({
        queryKey: [`/api/consultation/${consultationId}`],
        enabled: !!consultationId && !!uid,
    });
    const { data: messages, isLoading: loadingMessages } = useQuery({
        queryKey: [`/api/chat/${consultationId}/messages`],
        enabled: !!consultationId && !!uid && consultation?.status === "accepted",
        refetchInterval: 1000,
    });
    const sendMutation = useMutation({
        mutationFn: (content) => apiRequest("POST", `/api/chat/${consultationId}/messages`, { message: content }),
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: [`/api/chat/${consultationId}/messages`] });
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        },
        onError: (error) => {
            toast({
                title: "Send Failed",
                description: error.message || "Failed to send message",
                variant: "destructive",
            });
        },
    });
    useEffect(() => {
        if (messages && messages.length > 0) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages?.length]);
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim())
            return;
        sendMutation.mutate(message);
    };
    const handleBack = () => {
        setLocation(`/${userRole}/consultations`);
    };
    if (loadingConsultation) {
        return (<div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    if (!consultation) {
        return (<div className="text-center py-12">
        <p className="text-muted-foreground">Consultation not found</p>
        <Button className="mt-4" onClick={handleBack}>Go Back</Button>
      </div>);
    }
    if (consultation.status !== "accepted") {
        return (<div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2"/>
          Back to Consultations
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground"/>
            <p className="text-muted-foreground">
              {consultation.status === "pending"
                ? "Waiting for doctor to accept the consultation request"
                : "This consultation request has been rejected"}
            </p>
          </CardContent>
        </Card>
      </div>);
    }
    const otherParty = userRole === "patient"
        ? { name: consultation.doctorUsername, icon: Stethoscope }
        : { name: consultation.patientUsername, icon: User };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2"/>
          Back to Consultations
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <otherParty.icon className="h-5 w-5 text-primary"/>
              </div>
              <div>
                <CardTitle className="text-lg">
                  {userRole === "patient" ? "Dr. " : ""}{otherParty.name}
                </CardTitle>
                <CardDescription>
                  {consultation.requestedAt ? format(new Date(consultation.requestedAt), "MMM d, yyyy") : ""}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
              Active Consultation
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Consultation Reason:</p>
            <p className="text-sm text-muted-foreground">{consultation.reason}</p>
          </div>

          <div className="border rounded-lg">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {loadingMessages ? (<div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                  </div>) : messages && messages.length > 0 ? (messages.map((msg) => {
            const isMyMessage = msg.isCurrentUser;
            return (<div key={msg.id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${isMyMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"}`}>
                          <p className="text-sm break-words">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isMyMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {msg.sentAt ? format(new Date(msg.sentAt), "h:mm a") : ""}
                          </p>
                        </div>
                      </div>);
        })) : (<div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>)}
                <div ref={scrollRef}/>
              </div>
            </ScrollArea>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={sendMutation.isPending} data-testid="input-message"/>
            <Button type="submit" disabled={sendMutation.isPending || !message.trim()} data-testid="button-send">
              {sendMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<Send className="h-4 w-4"/>)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>);
}
