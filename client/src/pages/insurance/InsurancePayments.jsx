import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CheckCircle, Clock, FileText, TrendingUp } from "lucide-react";
export default function InsurancePayments() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const { data: claims, isLoading } = useQuery({
        queryKey: ["/api/insurance/claims"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const payMutation = useMutation({
        mutationFn: async (claimId) => {
            return apiRequest("POST", `/api/insurance/claims/${claimId}/pay`, {});
        },
        onSuccess: () => {
            toast({
                title: "Payment Processed",
                description: "The claim has been marked as paid successfully"
            });
            queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims"] });
        },
        onError: () => {
            toast({
                title: "Payment Failed",
                description: "Failed to process payment. Please try again.",
                variant: "destructive"
            });
        },
    });
    const approvedClaims = claims?.filter((c) => c.status === "approved") || [];
    const paidClaims = claims?.filter((c) => c.status === "paid") || [];
    const totalApprovedAmount = approvedClaims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const totalPaidAmount = paidClaims.reduce((sum, c) => sum + parseFloat(c.paidAmount || 0), 0);
    const formatDate = (date) => {
        if (!date)
            return "N/A";
        return new Date(date).toLocaleDateString();
    };
    const formatCurrency = (amount) => {
        return `BDAG ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">Process approved claims and track payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-payment-count">{approvedClaims.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved claims</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-amount-due">{formatCurrency(totalApprovedAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">To be paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-paid-count">{paidClaims.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-paid">{formatCurrency(totalPaidAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Queue</CardTitle>
          <CardDescription>Process approved claims and view payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" data-testid="tab-pending-payments">
                Pending Payment ({approvedClaims.length})
              </TabsTrigger>
              <TabsTrigger value="paid" data-testid="tab-paid-history">
                Payment History ({paidClaims.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : approvedClaims.length > 0 ? (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Number</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Approved On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedClaims.map((claim) => (<TableRow key={claim.id} data-testid={`row-pending-claim-${claim.id}`}>
                        <TableCell className="font-mono text-xs">{claim.claimNumber}</TableCell>
                        <TableCell className="text-sm">{claim.hospitalId?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{claim.patientId?.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant="outline">{claim.claimType}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(claim.amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(claim.respondedAt)}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => payMutation.mutate(claim.id)} disabled={payMutation.isPending} data-testid={`button-pay-${claim.id}`}>
                            <DollarSign className="h-4 w-4 mr-1"/>
                            Process Payment
                          </Button>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>) : (<div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                  <p className="text-muted-foreground">No approved claims pending payment</p>
                </div>)}
            </TabsContent>

            <TabsContent value="paid" className="mt-6">
              {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : paidClaims.length > 0 ? (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Number</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidClaims.map((claim) => (<TableRow key={claim.id} data-testid={`row-paid-claim-${claim.id}`}>
                        <TableCell className="font-mono text-xs">{claim.claimNumber}</TableCell>
                        <TableCell className="text-sm">{claim.hospitalId?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{claim.patientId?.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant="outline">{claim.claimType}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(claim.paidAmount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(claim.paidAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3"/>
                            Paid
                          </Badge>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>) : (<div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                  <p className="text-muted-foreground">No payment history yet</p>
                </div>)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);
}
