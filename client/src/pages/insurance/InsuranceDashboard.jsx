import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { ClipboardList, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
export default function InsuranceDashboard() {
    const { uid } = useWallet();
    const [, setLocation] = useLocation();
    const { data: claims } = useQuery({
        queryKey: ["/api/insurance/claims"],
        enabled: !!uid,
    });
    const pendingClaims = Array.isArray(claims) ? claims.filter((c) => c.status === "pending" || c.status === "under_review")?.length : 0;
    const approvedClaims = Array.isArray(claims) ? claims.filter((c) => c.status === "approved")?.length : 0;
    const rejectedClaims = Array.isArray(claims) ? claims.filter((c) => c.status === "rejected")?.length : 0;
    const totalPayout = Array.isArray(claims) ? claims.filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + parseFloat(c.paidAmount || 0), 0) : 0;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insurance Provider</h1>
        <p className="text-muted-foreground">Review and process insurance claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-claims">{pendingClaims}</div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-approved-claims">{approvedClaims}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejectedClaims}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayout.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/insurance/connections")} data-testid="card-navigate-connections">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-3/10 text-chart-3 mb-3">
              <Users className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">Patient Requests</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/insurance/claims")} data-testid="card-navigate-claims">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-5/10 text-chart-5 mb-3">
              <ClipboardList className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">Review Claims</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/insurance/policies")} data-testid="card-navigate-policies">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-1/10 text-chart-1 mb-3">
              <CheckCircle className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">Manage Policies</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/insurance/analytics")} data-testid="card-navigate-analytics">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-4/10 text-chart-4 mb-3">
              <TrendingUp className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">View Analytics</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>);
}
