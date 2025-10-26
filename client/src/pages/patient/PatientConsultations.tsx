import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, MessageSquare, Calendar, Clock, CheckCircle, XCircle, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

export default function PatientConsultations() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [requestReason, setRequestReason] = useState("");

  const { data: doctors, isLoading: loadingDoctors } = useQuery<any[]>({
    queryKey: ["/api/consultation/doctors"],
    enabled: !!uid,
    refetchInterval: 5000,
  });

  const { data: consultations, isLoading: loadingConsultations } = useQuery<any[]>({
    queryKey: ["/api/consultation/patient/requests"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const requestMutation = useMutation({
    mutationFn: (data: { doctorId: string; reason: string }) => 
      apiRequest("POST", "/api/consultation/request", data),
    onSuccess: () => {
      toast({
        title: "Request Sent",
        description: "Your consultation request has been sent to the doctor",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consultation/patient/requests"] });
      setSelectedDoctor(null);
      setRequestReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send consultation request",
        variant: "destructive",
      });
    },
  });

  const handleRequestConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !requestReason.trim()) return;
    
    requestMutation.mutate({
      doctorId: selectedDoctor.id,
      reason: requestReason,
    });
  };

  const filteredDoctors = doctors?.filter((doctor) => 
    doctor.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consultations</h1>
        <p className="text-muted-foreground">Request consultations with doctors in your hospital</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Doctors</CardTitle>
              <CardDescription>Browse and request consultations with doctors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-doctors"
                />
              </div>

              {loadingDoctors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDoctors && filteredDoctors.length > 0 ? (
                <div className="space-y-3">
                  {filteredDoctors.map((doctor) => (
                    <Card key={doctor.id} className="hover-elevate" data-testid={`card-doctor-${doctor.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Stethoscope className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{doctor.username}</h3>
                              {doctor.specialization && (
                                <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                              )}
                              {doctor.yearsOfExperience && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {doctor.yearsOfExperience} years of experience
                                </p>
                              )}
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedDoctor(doctor)}
                                data-testid={`button-request-${doctor.id}`}
                              >
                                Request
                              </Button>
                            </DialogTrigger>
                            <DialogContent data-testid="dialog-request-consultation">
                              <DialogHeader>
                                <DialogTitle>Request Consultation</DialogTitle>
                                <DialogDescription>
                                  Send a consultation request to Dr. {doctor.username}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleRequestConsultation} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reason">Reason for Consultation</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Describe your symptoms or reason for consultation..."
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    required
                                    rows={4}
                                    data-testid="input-consultation-reason"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="submit"
                                    disabled={requestMutation.isPending}
                                    className="flex-1"
                                    data-testid="button-submit-request"
                                  >
                                    {requestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Request
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No doctors found in your hospital</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>Your consultation requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConsultations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : consultations && consultations.length > 0 ? (
                <div className="space-y-3">
                  {consultations.map((consultation) => (
                    <Card key={consultation.id} className="hover-elevate" data-testid={`card-consultation-${consultation.id}`}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Dr. {consultation.doctorName}</span>
                            {getStatusBadge(consultation.status)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {consultation.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {consultation.requestedAt && format(new Date(consultation.requestedAt), "MMM d, yyyy")}
                          </p>
                          {consultation.status === "accepted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => setLocation(`/patient/consultations/${consultation.id}/chat`)}
                              data-testid={`button-chat-${consultation.id}`}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Open Chat
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No consultation requests yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
