import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Clock, CheckCircle, XCircle, Loader2, DollarSign, Plus, Building2, AlertCircle, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
const connectionSchema = z.object({
    providerId: z.string().min(1, "Required"),
    connectionReason: z.string().min(10, "Please provide a reason (at least 10 characters)"),
});
const claimActionSchema = z.object({
    note: z.string().optional(),
});
export default function PatientInsurance() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [claimActionDialogOpen, setClaimActionDialogOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [claimAction, setClaimAction] = useState("approve");
    const [selectedConnection, setSelectedConnection] = useState(null);
    const { data: connections, isLoading: connectionsLoading } = useQuery({
        queryKey: ["/api/patient/insurance"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const { data: claims, isLoading: claimsLoading } = useQuery({
        queryKey: ["/api/patient/claims"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const { data: availableProviders, isLoading: providersLoading } = useQuery({
        queryKey: ["/api/patient/insurance/available-providers"],
        enabled: !!uid,
        refetchInterval: 10000,
    });
    const form = useForm({
        resolver: zodResolver(connectionSchema),
        defaultValues: {
            providerId: "",
            connectionReason: "",
        },
    });
    const claimActionForm = useForm({
        resolver: zodResolver(claimActionSchema),
        defaultValues: {
            note: "",
        },
    });
    const connectMutation = useMutation({
        mutationFn: (data) => apiRequest("POST", "/api/patient/insurance/connect", data),
        onSuccess: () => {
            toast({
                title: "Connection Request Submitted",
                description: "Your insurance connection request has been submitted for review",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/insurance"] });
            setConnectionDialogOpen(false);
            form.reset();
            setSelectedProvider(null);
        },
        onError: (error) => {
            toast({
                title: "Connection Request Failed",
                description: error.message || "Failed to submit connection request",
                variant: "destructive",
            });
        },
    });
    const claimActionMutation = useMutation({
        mutationFn: ({ id, action, note }) => apiRequest("POST", `/api/patient/claims/${id}/${action}`, { note }),
        onSuccess: (_, variables) => {
            toast({
                title: variables.action === "approve" ? "Claim Approved" : "Claim Rejected",
                description: variables.action === "approve"
                    ? "The claim has been approved"
                    : "The claim has been rejected",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/claims"] });
            setClaimActionDialogOpen(false);
            claimActionForm.reset();
            setSelectedClaim(null);
        },
        onError: (error) => {
            toast({
                title: "Action Failed",
                description: error.message || "Failed to process claim action",
                variant: "destructive",
            });
        },
    });
    const paymentMutation = useMutation({
        mutationFn: async (connectionId) => {
            const response = await fetch(`/api/patient/insurance/pay/${connectionId}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "x-wallet-address": window.localStorage.getItem("wallet-address") || "",
                },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to process payment");
            }
            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Payment Successful",
                description: `Successfully paid $${parseFloat(data.amount || 0).toFixed(2)}. Next billing date: ${new Date(data.nextBillingDate).toLocaleDateString()}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/insurance"] });
            setSelectedConnection(null);
        },
        onError: (error) => {
            toast({
                title: "Payment Failed",
                description: error.message || "Failed to process payment",
                variant: "destructive",
            });
        },
    });
    const handleConnect = (provider) => {
        setSelectedProvider(provider);
        form.setValue("providerId", provider.id);
        setConnectionDialogOpen(true);
    };
    const handleClaimAction = (claim, action) => {
        setSelectedClaim(claim);
        setClaimAction(action);
        setClaimActionDialogOpen(true);
    };
    const handlePayment = (connection) => {
        setSelectedConnection(connection);
        paymentMutation.mutate(connection.id);
    };
    const onSubmit = (data) => {
        connectMutation.mutate(data);
    };
    const onClaimActionSubmit = (data) => {
        if (selectedClaim) {
            claimActionMutation.mutate({
                id: selectedClaim.id,
                action: claimAction,
                note: data.note,
            });
        }
    };
    const activeConnections = connections && Array.isArray(connections)
        ? connections.filter((conn) => conn.status === "connected")
        : [];
    const pendingClaims = claims && Array.isArray(claims)
        ? claims.filter((claim) => claim.status === "pending")
        : [];
    const otherClaims = claims && Array.isArray(claims)
        ? claims.filter((claim) => claim.status !== "pending")
        : [];
    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
            case "paid":
            case "connected":
                return <CheckCircle className="h-4 w-4 text-chart-2"/>;
            case "rejected":
            case "disconnected":
                return <XCircle className="h-4 w-4 text-destructive"/>;
            default:
                return <Clock className="h-4 w-4 text-chart-5"/>;
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
            case "paid":
            case "connected":
                return "default";
            case "rejected":
            case "disconnected":
                return "destructive";
            default:
                return "outline";
        }
    };
    const hasActiveConnection = activeConnections.length > 0;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insurance & Claims</h1>
        <p className="text-muted-foreground">Manage your insurance connections and track claim status</p>
      </div>

      {/* Connection Status */}
      {!hasActiveConnection && (<Card className="border-chart-5/30 bg-chart-5/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-5/20">
                <AlertCircle className="h-6 w-6 text-chart-5"/>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">No Insurance Connection</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Your account is not connected to any insurance service. Please connect to get started.
                </p>
                <p className="text-xs text-muted-foreground">
                  Browse available insurance providers below and submit a connection request.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>)}

      {/* Current Insurance Connections */}
      {activeConnections.length > 0 && (<Card>
          <CardHeader>
            <CardTitle>My Insurance Connections</CardTitle>
            <CardDescription>Your active insurance connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeConnections.map((connection) => (<Card key={connection.id} data-testid={`card-connection-${connection.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-chart-4/10 text-chart-4">
                          <Link2 className="h-5 w-5"/>
                        </div>
                        <div>
                          <CardTitle className="text-base">{connection.providerName}</CardTitle>
                          <p className="text-xs text-muted-foreground">Connected</p>
                        </div>
                      </div>
                      <Badge variant="default">
                        {connection.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Fee</span>
                      <span className="font-semibold">${parseFloat(connection.monthlyFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coverage Limit</span>
                      <span className="font-semibold">BDAG{parseFloat(connection.coverageLimit || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Coverage Types</p>
                      <div className="flex flex-wrap gap-1">
                        {connection.coverageTypes?.map((type, i) => (<Badge key={i} variant="secondary" className="text-xs">
                            {type}
                          </Badge>))}
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      {connection.lastBillingDate && (<div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Last Payment</span>
                          <span>{new Date(connection.lastBillingDate).toLocaleDateString()}</span>
                        </div>)}
                      {connection.missedPaymentsCount !== undefined && connection.missedPaymentsCount > 0 && (<div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Missed Payments</span>
                          <Badge variant="destructive" className="text-xs">
                            {connection.missedPaymentsCount}
                          </Badge>
                        </div>)}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Connected Since</span>
                        <span>{new Date(connection.approvedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-2" onClick={() => handlePayment(connection)} data-testid={`button-pay-${connection.id}`}>
                      <DollarSign className="h-4 w-4 mr-1"/>
                      Pay Monthly Fee (BDAG{parseFloat(connection.monthlyFee || 0).toFixed(2)})
                    </Button>
                  </CardContent>
                </Card>))}
            </div>
          </CardContent>
        </Card>)}

      {/* Available Insurance Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Insurance Providers</CardTitle>
          <CardDescription>Browse and connect to insurance providers</CardDescription>
        </CardHeader>
        <CardContent>
          {providersLoading ? (<div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : availableProviders && Array.isArray(availableProviders) && availableProviders.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableProviders.map((provider) => (<Card key={provider.id} className="hover-elevate" data-testid={`card-provider-${provider.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5"/>
                        </div>
                        <div>
                          <CardTitle className="text-base">{provider.providerName}</CardTitle>
                          <p className="text-xs text-muted-foreground">{provider.username}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {provider.description && (<p className="text-sm text-muted-foreground">{provider.description}</p>)}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Fee</span>
                      <span className="font-semibold text-primary">BDAG{parseFloat(provider.monthlyFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coverage Limit</span>
                      <span className="font-semibold text-primary">BDAG{parseFloat(provider.coverageLimit || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Coverage Types</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.coverageTypes?.map((type, i) => (<Badge key={i} variant="outline" className="text-xs">
                            {type}
                          </Badge>))}
                      </div>
                    </div>
                    <Button className="w-full mt-2" onClick={() => handleConnect(provider)} data-testid={`button-connect-${provider.id}`}>
                      <Plus className="h-4 w-4 mr-1"/>
                      Connect to This Provider
                    </Button>
                  </CardContent>
                </Card>))}
            </div>) : (<div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50"/>
              <p>No insurance providers available at the moment</p>
            </div>)}
        </CardContent>
      </Card>

      {/* Claims Pending Your Approval */}
      {pendingClaims.length > 0 && (<Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-chart-5"/>
              <CardTitle>Claims Pending Your Approval</CardTitle>
            </div>
            <CardDescription>Review and approve/reject treatment claims from hospitals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingClaims.map((claim) => (<Card key={claim.id} className="border-chart-5/30 bg-chart-5/5" data-testid={`card-pending-claim-${claim.id}`}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold font-mono">{claim.claimNumber}</span>
                            <Badge variant="outline" className="gap-1 border-chart-5 text-chart-5">
                              <Clock className="h-3 w-3"/>
                              Pending Your Approval
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Hospital</p>
                              <p className="font-medium">{claim.hospitalName || "Medical Center"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Amount</p>
                              <p className="font-semibold flex items-center gap-1">
                                <DollarSign className="h-3 w-3"/>
                                {parseFloat(claim.amount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Claim Type</p>
                              <Badge variant="outline" className="text-xs capitalize">
                                {claim.claimType}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Submitted</p>
                              <p className="text-xs">{new Date(claim.submittedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {claim.treatmentDescription && (<div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-1">Treatment Description</p>
                              <p className="text-sm">{claim.treatmentDescription}</p>
                            </div>)}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleClaimAction(claim, "reject")} data-testid={`button-reject-claim-${claim.id}`}>
                          <XCircle className="h-4 w-4 mr-1"/>
                          Reject
                        </Button>
                        <Button className="flex-1" onClick={() => handleClaimAction(claim, "approve")} data-testid={`button-approve-claim-${claim.id}`}>
                          <CheckCircle className="h-4 w-4 mr-1"/>
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>))}
            </div>
          </CardContent>
        </Card>)}

      {/* Insurance Claims */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Claims</CardTitle>
          <CardDescription>Track the status of your submitted claims</CardDescription>
        </CardHeader>
        <CardContent>
          {claimsLoading ? (<div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : otherClaims.length > 0 ? (<div className="space-y-3">
              {otherClaims.map((claim) => (<Card key={claim.id} className="hover-elevate" data-testid={`card-claim-${claim.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground"/>
                          <span className="font-semibold font-mono">{claim.claimNumber}</span>
                          <Badge variant={getStatusColor(claim.status)} className="gap-1">
                            {getStatusIcon(claim.status)}
                            {claim.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Hospital</p>
                            <p className="font-medium">{claim.hospitalName || "Medical Center"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Amount</p>
                            <p className="font-semibold flex items-center gap-1">
                              <DollarSign className="h-3 w-3"/>
                              {parseFloat(claim.amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Claim Type</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {claim.claimType}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Submitted</p>
                            <p className="text-xs">{new Date(claim.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {claim.status === "approved" && claim.paidAmount && (<div className="mt-3 pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Paid Amount</span>
                              <span className="font-semibold text-chart-2">
                                ${parseFloat(claim.paidAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>)}
                        {claim.rejectionReason && (<div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                            <p className="text-sm text-destructive">{claim.rejectionReason}</p>
                          </div>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>))}
            </div>) : (<div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50"/>
              <p>No insurance claims yet</p>
            </div>)}
        </CardContent>
      </Card>

      {/* Connection Request Dialog */}
      <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
        <DialogContent data-testid="dialog-connection-request">
          <DialogHeader>
            <DialogTitle>Connect to {selectedProvider?.providerName}</DialogTitle>
            <DialogDescription>
              Submit a connection request to this insurance provider
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="connectionReason" render={({ field }) => (<FormItem>
                    <FormLabel>Reason for Connection</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Please explain why you want to connect to this insurance provider..." {...field} data-testid="textarea-connection-reason"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setConnectionDialogOpen(false)} data-testid="button-cancel-connection">
                  Cancel
                </Button>
                <Button type="submit" disabled={connectMutation.isPending} data-testid="button-submit-connection">
                  {connectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Claim Action Dialog */}
      <Dialog open={claimActionDialogOpen} onOpenChange={setClaimActionDialogOpen}>
        <DialogContent data-testid="dialog-claim-action">
          <DialogHeader>
            <DialogTitle>
              {claimAction === "approve" ? "Approve" : "Reject"} Claim
            </DialogTitle>
            <DialogDescription>
              {claimAction === "approve"
            ? "Confirm that you want to approve this claim"
            : "Please provide a reason for rejecting this claim"}
            </DialogDescription>
          </DialogHeader>
          <Form {...claimActionForm}>
            <form onSubmit={claimActionForm.handleSubmit(onClaimActionSubmit)} className="space-y-4">
              <FormField control={claimActionForm.control} name="note" render={({ field }) => (<FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this decision..." {...field} data-testid="textarea-claim-note"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setClaimActionDialogOpen(false)} data-testid="button-cancel-claim-action">
                  Cancel
                </Button>
                <Button type="submit" variant={claimAction === "reject" ? "destructive" : "default"} disabled={claimActionMutation.isPending} data-testid="button-submit-claim-action">
                  {claimActionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                  {claimAction === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>);
}
