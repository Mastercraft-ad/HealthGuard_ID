import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useState } from "react";
import KYCDetailsDialog from "@/components/KYCDetailsDialog";

export default function AdminKYC() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [selectedKYC, setSelectedKYC] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: kycQueue, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/kyc-queue"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const approveMutation = useMutation({
    mutationFn: async (kycId: string) => {
      return apiRequest("POST", `/api/admin/kyc/${kycId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Approved", description: "User has been verified" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-queue"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ kycId, reason }: { kycId: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/kyc/${kycId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({ title: "KYC Rejected", description: "User has been notified" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-queue"] });
    },
  });

  const pendingKYC = kycQueue?.filter((k: any) => k.status === "pending") || [];
  const reviewedKYC = kycQueue?.filter((k: any) => k.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-kyc-management">KYC Management</h1>
        <p className="text-muted-foreground">Review and approve identity verification submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="count-pending-kyc">{pendingKYC.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="count-approved-kyc">
              {reviewedKYC.filter((k: any) => k.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">Verified users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="count-rejected-kyc">
              {reviewedKYC.filter((k: any) => k.status === "rejected").length}
            </div>
            <p className="text-xs text-muted-foreground">Declined submissions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending KYC Submissions</CardTitle>
          <CardDescription>Review and verify user identity documents</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-kyc">Loading...</div>
          ) : pendingKYC.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingKYC.map((kyc: any) => (
                  <TableRow key={kyc.id} data-testid={`row-kyc-${kyc.id}`}>
                    <TableCell className="font-medium" data-testid={`text-kyc-name-${kyc.id}`}>{kyc.fullName}</TableCell>
                    <TableCell>
                      {kyc.requestedRole ? (
                        <Badge variant="secondary" data-testid={`badge-kyc-role-${kyc.id}`}>
                          {kyc.requestedRole.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-kyc-doctype-${kyc.id}`}>{kyc.documentType || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-kyc-date-${kyc.id}`}>
                      {new Date(kyc.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedKYC(kyc);
                            setDialogOpen(true);
                          }}
                          className="gap-1"
                          data-testid={`button-view-kyc-${kyc.id}`}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(kyc.id)}
                          disabled={approveMutation.isPending}
                          className="gap-1"
                          data-testid={`button-approve-kyc-${kyc.id}`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate({ kycId: kyc.id, reason: "Invalid documents" })}
                          disabled={rejectMutation.isPending}
                          className="gap-1"
                          data-testid={`button-reject-kyc-${kyc.id}`}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-pending-kyc">No pending KYC submissions</p>
            </div>
          )}
        </CardContent>
      </Card>

      <KYCDetailsDialog 
        kyc={selectedKYC} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}
