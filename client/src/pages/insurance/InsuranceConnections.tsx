import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function InsuranceConnections() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: connections, isLoading } = useQuery<any[]>({
    queryKey: ["/api/insurance/connections"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const approveMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return await apiRequest("POST", `/api/insurance/connections/${connectionId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/analytics"] });
      toast({
        title: "Connection Approved",
        description: "Patient has been successfully connected to your insurance plan",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve connection request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ connectionId, reason }: { connectionId: string; reason: string }) => {
      return await apiRequest("POST", `/api/insurance/connections/${connectionId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/analytics"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedConnection(null);
      toast({
        title: "Connection Rejected",
        description: "Patient connection request has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject connection request",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (connection: any) => {
    setSelectedConnection(connection);
    setDetailsDialogOpen(true);
  };

  const handleApproveFromDialog = () => {
    if (selectedConnection) {
      approveMutation.mutate(selectedConnection.id);
      setDetailsDialogOpen(false);
      setSelectedConnection(null);
    }
  };

  const handleRejectFromDialog = () => {
    setDetailsDialogOpen(false);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    if (selectedConnection) {
      rejectMutation.mutate({ connectionId: selectedConnection.id, reason: rejectReason });
    }
  };

  const pendingConnections = connections?.filter(c => c.status === "pending") || [];
  const connectedPatients = connections?.filter(c => c.status === "connected") || [];
  const rejectedConnections = connections?.filter(c => c.status === "disconnected") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "connected":
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case "disconnected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Connection Requests</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Connection Requests</h1>
        <p className="text-muted-foreground">Review and manage patient insurance connection requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-requests">{pendingConnections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Patients</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-connected-patients">{connectedPatients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-rejected-requests">{rejectedConnections.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingConnections.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Requests</h2>
          <div className="space-y-4">
            {pendingConnections.map((connection: any) => (
              <Card key={connection.id} data-testid={`card-connection-${connection.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{connection.patientName || "Patient"}</CardTitle>
                        <CardDescription>Patient UID: {connection.patientUid || "N/A"}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(connection.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connection.medicalHistory && (
                      <div>
                        <Label className="text-sm font-medium">Medical History</Label>
                        <p className="text-sm text-muted-foreground mt-1">{connection.medicalHistory}</p>
                      </div>
                    )}
                    {connection.requestedAt && (
                      <div>
                        <Label className="text-sm font-medium">Requested On</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(connection.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button
                        onClick={() => handleViewDetails(connection)}
                        className="w-full"
                        data-testid={`button-view-details-${connection.id}`}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Patient Details & Review Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Connected Patients */}
      {connectedPatients.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Connected Patients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedPatients.map((connection: any) => (
              <Card key={connection.id} data-testid={`card-connected-${connection.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{connection.patientName || "Patient"}</CardTitle>
                        <CardDescription className="text-xs">{connection.patientUid || "N/A"}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(connection.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {connection.connectedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connected Since</span>
                        <span className="font-medium">{new Date(connection.connectedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {connection.lastBillingDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Billing</span>
                        <span className="font-medium">{new Date(connection.lastBillingDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {connection.missedPaymentsCount !== undefined && connection.missedPaymentsCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Missed Payments</span>
                        <span className="font-medium text-destructive">{connection.missedPaymentsCount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingConnections.length === 0 && connectedPatients.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No patient connection requests yet</p>
          </CardContent>
        </Card>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-patient-details">
          <DialogHeader>
            <DialogTitle>Patient Connection Request - Detailed Review</DialogTitle>
            <DialogDescription>
              Review complete patient information before approving or rejecting the insurance connection request
            </DialogDescription>
          </DialogHeader>
          
          {selectedConnection && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Patient Name</Label>
                    <p className="font-medium">{selectedConnection.patientUsername || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Patient UID</Label>
                    <p className="font-mono text-sm">{selectedConnection.patientUid || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedConnection.patientEmail || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Request Date</Label>
                    <p className="font-medium">
                      {selectedConnection.requestedAt
                        ? new Date(selectedConnection.requestedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Reason */}
              {selectedConnection.connectionReason && (
                <div>
                  <Label className="text-sm font-semibold">Reason for Connection Request</Label>
                  <p className="mt-2 p-3 bg-muted rounded-md text-sm">{selectedConnection.connectionReason}</p>
                </div>
              )}

              {/* Health Profile */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Health Profile
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Blood Type</Label>
                    <p className="font-medium">{selectedConnection.bloodType || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Organ Donor</Label>
                    <p className="font-medium">{selectedConnection.organDonor ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Height</Label>
                    <p className="font-medium">
                      {selectedConnection.height ? `${selectedConnection.height} cm` : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Weight</Label>
                    <p className="font-medium">
                      {selectedConnection.weight ? `${selectedConnection.weight} kg` : "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Allergies */}
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Allergies</Label>
                  <div className="mt-2">
                    {selectedConnection.allergies && selectedConnection.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedConnection.allergies.map((allergy: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No known allergies</p>
                    )}
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Chronic Conditions</Label>
                  <div className="mt-2">
                    {selectedConnection.chronicConditions && selectedConnection.chronicConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedConnection.chronicConditions.map((condition: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No chronic conditions reported</p>
                    )}
                  </div>
                </div>

                {/* Current Medications */}
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Current Medications</Label>
                  <div className="mt-2">
                    {selectedConnection.currentMedications && selectedConnection.currentMedications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedConnection.currentMedications.map((medication: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                            {medication}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No current medications</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(selectedConnection.emergencyContact || selectedConnection.emergencyPhone) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedConnection.emergencyContact && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Contact Name</Label>
                        <p className="font-medium">{selectedConnection.emergencyContact}</p>
                      </div>
                    )}
                    {selectedConnection.emergencyPhone && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Phone Number</Label>
                        <p className="font-medium">{selectedConnection.emergencyPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDetailsDialogOpen(false);
                setSelectedConnection(null);
              }}
              data-testid="button-close-details"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectFromDialog}
              disabled={rejectMutation.isPending}
              data-testid="button-reject-from-details"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Request
            </Button>
            <Button
              onClick={handleApproveFromDialog}
              disabled={approveMutation.isPending}
              data-testid="button-approve-from-details"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {approveMutation.isPending ? "Approving..." : "Approve Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-reason">
          <DialogHeader>
            <DialogTitle>Reject Connection Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this patient's connection request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Pre-existing conditions not covered, incomplete medical history..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              data-testid="textarea-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
                setSelectedConnection(null);
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
