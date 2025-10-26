import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, DollarSign, Users, FileCheck, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
export default function InsuranceAnalytics() {
    const { uid } = useWallet();
    const { data: analytics, isLoading } = useQuery({
        queryKey: ["/api/insurance/analytics"],
        enabled: !!uid,
    });
    if (isLoading) {
        return (<div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    const statusData = analytics?.statusCounts || {};
    const claimTypeData = analytics?.claimTypeAmounts || {};
    const totalStatuses = Object.values(statusData).reduce((a, b) => a + b, 0);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Claims insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims This Month</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-claims-month">{analytics?.claimsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payout">BDAG {(analytics?.totalPayout || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-approval-rate">{analytics?.approvalRate || 0}%</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-enrollees">{analytics?.activeEnrollees || 0}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Claims by Status</CardTitle>
            <CardDescription>Distribution of claim statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-5" style={{ width: totalStatuses > 0 ? `${(statusData.pending / totalStatuses) * 100}%` : "0%" }}/>
                  </div>
                  <span className="text-sm font-medium">{statusData.pending || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Under Review</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-3" style={{ width: totalStatuses > 0 ? `${(statusData.under_review / totalStatuses) * 100}%` : "0%" }}/>
                  </div>
                  <span className="text-sm font-medium">{statusData.under_review || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Approved</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-2" style={{ width: totalStatuses > 0 ? `${(statusData.approved / totalStatuses) * 100}%` : "0%" }}/>
                  </div>
                  <span className="text-sm font-medium">{statusData.approved || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Paid</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-1" style={{ width: totalStatuses > 0 ? `${(statusData.paid / totalStatuses) * 100}%` : "0%" }}/>
                  </div>
                  <span className="text-sm font-medium">{statusData.paid || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rejected</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive" style={{ width: totalStatuses > 0 ? `${(statusData.rejected / totalStatuses) * 100}%` : "0%" }}/>
                  </div>
                  <span className="text-sm font-medium">{statusData.rejected || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claim Types by Amount</CardTitle>
            <CardDescription>Total amounts by claim category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Emergency Care</span>
                <span className="text-sm font-medium">BDAG {(claimTypeData.emergency || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Outpatient Services</span>
                <span className="text-sm font-medium">BDAG {(claimTypeData.outpatient || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inpatient Services</span>
                <span className="text-sm font-medium">BDAG {(claimTypeData.inpatient || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Surgery</span>
                <span className="text-sm font-medium">BDAG {(claimTypeData.surgery || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Key metrics summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Claims:</span>
                <span className="font-medium">{analytics?.totalClaims || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending Applications:</span>
                <span className="font-medium">{analytics?.pendingApplications || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Enrollees:</span>
                <span className="font-medium">{analytics?.activeEnrollees || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Approval Rate:</span>
                <span className="font-medium">{analytics?.approvalRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
            <CardDescription>Current month statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Claims:</span>
                <span className="font-medium">{analytics?.claimsThisMonth || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Payout:</span>
                <span className="font-medium">BDAG {(analytics?.totalPayout || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Claim:</span>
                <span className="font-medium">
                  BDAG {analytics?.claimsThisMonth > 0 ? Math.round(analytics.totalPayout / analytics.claimsThisMonth).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}
