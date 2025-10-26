import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
export default function InsuranceClaims() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const { data: claims, isLoading } = useQuery({
        queryKey: ["/api/insurance/claims"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const approveMutation = useMutation({
        mutationFn: async (claimId) => {
            return apiRequest("POST", `/api/insurance/claims/${claimId}/approve`, {});
        },
        onSuccess: () => {
            toast({ title: "Claim Approved" });
            queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims"] });
        },
    });
    const rejectMutation = useMutation({
        mutationFn: async ({ claimId, reason }) => {
            return apiRequest("POST", `/api/insurance/claims/${claimId}/reject`, { reason });
        },
        onSuccess: () => {
            toast({ title: "Claim Rejected" });
            queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims"] });
        },
    });
    const pendingPatientApproval = claims?.filter((c) => c.status === "pending_patient_approval") || [];
    const pending = claims?.filter((c) => c.status === "pending_insurance_approval" || c.status === "under_review") || [];
    const approved = claims?.filter((c) => c.status === "approved") || [];
    const paid = claims?.filter((c) => c.status === "paid") || [];
    const statusBadge = (status) => {
        const variants = {
            pending: { variant: "secondary", icon: Clock },
            pending_patient_approval: { variant: "outline", icon: Clock },
            pending_insurance_approval: { variant: "secondary", icon: Clock },
            patient_rejected: { variant: "destructive", icon: XCircle },
            under_review: { variant: "outline", icon: FileCheck },
            approved: { variant: "default", icon: CheckCircle },
            rejected: { variant: "destructive", icon: XCircle },
            paid: { variant: "default", icon: DollarSign },
        };
        const config = variants[status] || { variant: "outline", icon: FileCheck };
        const Icon = config.icon;
        return (<Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3"/>
        {status.replace(/_/g, " ")}
      </Badge>);
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <p className="text-muted-foreground">Review and process insurance claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Patient</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{pendingPatientApproval.length}</div>
            <p className="text-xs text-muted-foreground">Patient approval needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{pending.length}</div>
            <p className="text-xs text-muted-foreground">Needs your action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-approved-claims">{approved.length}</div>
            <p className="text-xs text-muted-foreground">Ready for payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paid.length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Claims</CardTitle>
          <CardDescription>Complete claims processing queue</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : claims && claims.length > 0 ? (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (<TableRow key={claim.id}>
                    <TableCell className="font-mono text-xs">{claim.claimNumber}</TableCell>
                    <TableCell className="text-sm">{claim.hospitalId?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm">{claim.patientId?.slice(0, 8)}...</TableCell>
                    <TableCell className="font-semibold">${claim.amount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{statusBadge(claim.status)}</TableCell>
                    <TableCell>
                      {claim.status === "pending_insurance_approval" || claim.status === "under_review" ? (<div className="flex gap-2">
                          <Button size="sm" onClick={() => approveMutation.mutate(claim.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${claim.id}`}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate({ claimId: claim.id, reason: "Insufficient documentation" })} disabled={rejectMutation.isPending} data-testid={`button-reject-${claim.id}`}>
                            Reject
                          </Button>
                        </div>) : claim.status === "pending_patient_approval" ? (<Badge variant="outline" className="text-xs">Awaiting Patient</Badge>) : claim.status === "approved" ? (<Badge variant="default" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3"/>
                          Approved - Go to Payments
                        </Badge>) : (<Button size="sm" variant="outline" data-testid={`button-view-${claim.id}`}>View Details</Button>)}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>) : (<div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground">No claims to process</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
