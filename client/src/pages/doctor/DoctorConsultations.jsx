import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Calendar, Clock, CheckCircle, XCircle, Loader2, User } from "lucide-react";
import { format } from "date-fns";
export default function DoctorConsultations() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const { data: consultations, isLoading } = useQuery({
        queryKey: ["/api/consultation/doctor/requests"],
        enabled: !!uid,
    });
    const acceptMutation = useMutation({
        mutationFn: (id) => apiRequest("POST", `/api/consultation/${id}/accept`, {}),
        onSuccess: () => {
            toast({
                title: "Request Accepted",
                description: "You can now chat with the patient",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/consultation/doctor/requests"] });
        },
        onError: (error) => {
            toast({
                title: "Accept Failed",
                description: error.message || "Failed to accept consultation request",
                variant: "destructive",
            });
        },
    });
    const rejectMutation = useMutation({
        mutationFn: (id) => apiRequest("POST", `/api/consultation/${id}/reject`, {}),
        onSuccess: () => {
            toast({
                title: "Request Rejected",
                description: "The consultation request has been declined",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/consultation/doctor/requests"] });
        },
        onError: (error) => {
            toast({
                title: "Reject Failed",
                description: error.message || "Failed to reject consultation request",
                variant: "destructive",
            });
        },
    });
    const pendingRequests = consultations?.filter((c) => c.status === "pending") || [];
    const acceptedRequests = consultations?.filter((c) => c.status === "accepted") || [];
    const rejectedRequests = consultations?.filter((c) => c.status === "rejected") || [];
    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1"/>Pending</Badge>;
            case "accepted":
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1"/>Accepted</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400"><XCircle className="h-3 w-3 mr-1"/>Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };
    const renderConsultationCard = (consultation, showActions = false) => (<Card key={consultation.id} className="hover-elevate" data-testid={`card-consultation-${consultation.id}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary"/>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{consultation.patientName}</h3>
                <p className="text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1"/>
                  {consultation.requestedAt && format(new Date(consultation.requestedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            {getStatusBadge(consultation.status)}
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Reason for Consultation:</p>
            <p className="text-sm text-muted-foreground">{consultation.reason}</p>
          </div>

          {showActions && (<div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => rejectMutation.mutate(consultation.id)} disabled={rejectMutation.isPending} data-testid={`button-reject-${consultation.id}`}>
                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1"/>}
                Reject
              </Button>
              <Button size="sm" className="flex-1" onClick={() => acceptMutation.mutate(consultation.id)} disabled={acceptMutation.isPending} data-testid={`button-accept-${consultation.id}`}>
                {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-1"/>}
                Accept
              </Button>
            </div>)}

          {consultation.status === "accepted" && (<Button size="sm" variant="outline" className="w-full" onClick={() => setLocation(`/doctor/consultations/${consultation.id}/chat`)} data-testid={`button-chat-${consultation.id}`}>
              <MessageSquare className="h-4 w-4 mr-1"/>
              Open Chat
            </Button>)}
        </div>
      </CardContent>
    </Card>);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consultation Requests</h1>
        <p className="text-muted-foreground">Manage patient consultation requests</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="accepted" data-testid="tab-accepted">
            Accepted {acceptedRequests.length > 0 && `(${acceptedRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected {rejectedRequests.length > 0 && `(${rejectedRequests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {isLoading ? (<div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : pendingRequests.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((consultation) => renderConsultationCard(consultation, true))}
            </div>) : (<Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50"/>
                <p>No pending consultation requests</p>
              </CardContent>
            </Card>)}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 mt-4">
          {isLoading ? (<div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : acceptedRequests.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedRequests.map((consultation) => renderConsultationCard(consultation))}
            </div>) : (<Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50"/>
                <p>No accepted consultations</p>
              </CardContent>
            </Card>)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {isLoading ? (<div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : rejectedRequests.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedRequests.map((consultation) => renderConsultationCard(consultation))}
            </div>) : (<Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50"/>
                <p>No rejected consultations</p>
              </CardContent>
            </Card>)}
        </TabsContent>
      </Tabs>
    </div>);
}
