import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, DollarSign, Clock, Loader2, Eye, Calendar, Hash, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import type { Claim } from "@shared/schema";

export default function HospitalInvoices() {
  const { uid } = useWallet();
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: claims, isLoading } = useQuery<Claim[]>({
    queryKey: ["/api/hospital/claims"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const totalRevenue = claims?.filter(c => c.status === "paid")
    .reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0) || 0;

  const pendingAmount = claims?.filter(c => c.status === "pending" || c.status === "under_review")
    .reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0) || 0;

  const thisMonthClaims = claims?.filter(c => {
    const claimDate = new Date(c.submittedAt);
    const now = new Date();
    return claimDate.getMonth() === now.getMonth() && claimDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hospital Invoices & Claims</h1>
        <p className="text-muted-foreground">Manage billing and insurance claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `BDAG ${totalRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Paid claims</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-amount">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `BDAG ${pendingAmount.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-month-claims">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : thisMonthClaims}
            </div>
            <p className="text-xs text-muted-foreground">Total claims</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
          <CardDescription>All submitted insurance claims</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !claims || claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No claims submitted yet</p>
              <p className="text-sm">Submit claims to track billing and payments</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                    <TableCell className="font-mono text-xs" data-testid="text-claim-number">
                      {claim.claimNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{claim.claimType}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold" data-testid="text-claim-amount">
                      BDAG {parseFloat(claim.amount || "0").toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          claim.status === "paid" ? "default" : 
                          claim.status === "approved" ? "default" :
                          claim.status === "rejected" ? "destructive" :
                          "secondary"
                        }
                        data-testid="badge-claim-status"
                      >
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {claim.paidAmount 
                        ? `BDAG ${parseFloat(claim.paidAmount).toLocaleString()}`
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(claim)}
                        data-testid={`button-view-details-${claim.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>Complete claim and invoice information</DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              {/* Claim Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Claim Information
                </h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Claim Number
                    </p>
                    <p className="font-mono text-sm font-semibold" data-testid="detail-claim-number">
                      {selectedClaim.claimNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Claim Type</p>
                    <Badge variant="outline" className="mt-1">{selectedClaim.claimType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge 
                      variant={
                        selectedClaim.status === "paid" ? "default" : 
                        selectedClaim.status === "approved" ? "default" :
                        selectedClaim.status === "rejected" ? "destructive" :
                        "secondary"
                      }
                      className="mt-1"
                    >
                      {selectedClaim.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Submitted Date
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(selectedClaim.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Information
                </h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Claim Amount</p>
                    <p className="text-lg font-bold text-primary" data-testid="detail-claim-amount">
                      BDAG {parseFloat(selectedClaim.amount || "0").toLocaleString()}
                    </p>
                  </div>
                  {selectedClaim.paidAmount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Amount</p>
                      <p className="text-lg font-bold text-chart-2" data-testid="detail-paid-amount">
                        BDAG {parseFloat(selectedClaim.paidAmount).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedClaim.paidAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedClaim.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedClaim.respondedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Response Date</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedClaim.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Treatment Details */}
              {selectedClaim.treatmentDescription && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Treatment Description
                  </h3>
                  <Separator />
                  <p className="text-sm bg-muted p-3 rounded-md" data-testid="detail-treatment-description">
                    {selectedClaim.treatmentDescription}
                  </p>
                </div>
              )}

              {/* Patient Note */}
              {selectedClaim.patientNote && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Patient Note</h3>
                  <Separator />
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedClaim.patientNote}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedClaim.rejectionReason && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-destructive">Rejection Reason</h3>
                  <Separator />
                  <p className="text-sm bg-destructive/10 p-3 rounded-md text-destructive">
                    {selectedClaim.rejectionReason}
                  </p>
                </div>
              )}

              {/* Blockchain Information */}
              {(selectedClaim.invoiceCID || selectedClaim.invoiceSignature) && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Blockchain Verification</h3>
                  <Separator />
                  <div className="space-y-2">
                    {selectedClaim.invoiceCID && (
                      <div>
                        <p className="text-sm text-muted-foreground">Invoice CID</p>
                        <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                          {selectedClaim.invoiceCID}
                        </p>
                      </div>
                    )}
                    {selectedClaim.invoiceSignature && (
                      <div>
                        <p className="text-sm text-muted-foreground">Signature</p>
                        <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                          {selectedClaim.invoiceSignature}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
