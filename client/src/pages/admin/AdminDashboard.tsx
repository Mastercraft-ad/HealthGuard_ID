import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { FileCheck, UserCog, Users, Activity, Shield, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { uid } = useWallet();
  const [, setLocation] = useLocation();

  const { data: kycQueue } = useQuery({
    queryKey: ["/api/admin/kyc-queue"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const { data: roleApplications } = useQuery({
    queryKey: ["/api/admin/role-applications"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const pendingKYC = kycQueue?.filter((k: any) => k.status === "pending")?.length || 0;
  const pendingRoles = roleApplications?.filter((r: any) => r.status === "pending")?.length || 0;
  const totalUsers = users?.length || 0;
  const verifiedUsers = users?.filter((u: any) => u.status === "verified")?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System administration and user management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-kyc">{pendingKYC}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Applications</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-roles">{pendingRoles}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/kyc")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-5/10 text-chart-5 mb-3">
              <FileCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">KYC Queue</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/roles")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-3/10 text-chart-3 mb-3">
              <UserCog className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">Role Management</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/users")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-1/10 text-chart-1 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">User Management</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kycQueue && kycQueue.slice(0, 5).map((kyc: any) => (
              <div key={kyc.id} className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <p className="font-medium">{kyc.fullName}</p>
                  <p className="text-xs text-muted-foreground">KYC submitted - {new Date(kyc.submittedAt).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  kyc.status === "approved" ? "bg-chart-2/10 text-chart-2" :
                  kyc.status === "pending" ? "bg-chart-5/10 text-chart-5" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {kyc.status}
                </span>
              </div>
            ))}
            {(!kycQueue || kycQueue.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
