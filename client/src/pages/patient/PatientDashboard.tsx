import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { FileText, QrCode, Shield, Heart, Upload, Activity, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export default function PatientDashboard() {
  const { uid, walletAddress, refreshUserData } = useWallet();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (walletAddress) {
      refreshUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const { data: userData } = useQuery({
    queryKey: ["/api/user/me"],
    enabled: !!uid,
    refetchInterval: 1000,
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/patient/profile"],
    enabled: !!uid,
    refetchInterval: 1000,
  });

  const { data: records } = useQuery({
    queryKey: ["/api/patient/records"],
    enabled: !!uid,
    refetchInterval: 1000,
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ["/api/patient/access-requests"],
    enabled: !!uid,
    refetchInterval: 1000,
  });

  const { data: claims } = useQuery({
    queryKey: ["/api/patient/claims"],
    enabled: !!uid,
    refetchInterval: 1000,
  });

  const status = userData?.status || "pending";
  const role = userData?.role || "patient";

  const quickActions = [
    {
      title: "Upload Records",
      description: "Add new medical documents",
      icon: Upload,
      onClick: () => setLocation("/patient/records"),
      color: "text-chart-1",
    },
    {
      title: "Generate QR Code",
      description: "Create emergency access",
      icon: QrCode,
      onClick: () => setLocation("/patient/qr"),
      color: "text-chart-2",
    },
    {
      title: "Manage Access",
      description: "Control who sees your data",
      icon: Shield,
      onClick: () => setLocation("/patient/access"),
      color: "text-chart-4",
    },
    {
      title: "View Claims",
      description: "Track insurance claims",
      icon: Heart,
      onClick: () => setLocation("/patient/insurance"),
      color: "text-chart-5",
    },
  ];

  const recordCount = records?.length || 0;
  const pendingCount = pendingRequests?.filter((r: any) => r.status === "pending")?.length || 0;
  const activeClaimsCount = claims?.filter((c: any) => c.status === "pending" || c.status === "under_review")?.length || 0;

  const handleRefresh = async () => {
    await refreshUserData();
    await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    await queryClient.refetchQueries({ queryKey: ["/api/user/me"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your health identity portal</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {status !== "verified" && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Account Not Verified</CardTitle>
            <CardDescription>
              Please complete your KYC verification to access all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/patient/profile")} data-testid="button-complete-kyc">
              Complete KYC Verification
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-record-count">{recordCount}</div>
            <p className="text-xs text-muted-foreground">Encrypted documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Requests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-requests">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending approvals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Claims</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-claims">{activeClaimsCount}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={status === "verified" ? "default" : "outline"} data-testid="badge-dashboard-status">
              {status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Current status</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover-elevate cursor-pointer" onClick={action.onClick}>
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-3 ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-base">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Profile</CardTitle>
            <CardDescription>Your emergency medical information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Blood Type</span>
                  <span className="font-mono font-semibold" data-testid="text-blood-type">
                    {profile.bloodType || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Allergies</span>
                  <span className="text-sm" data-testid="text-allergies">
                    {profile.allergies?.length > 0 ? profile.allergies.join(", ") : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Chronic Conditions</span>
                  <span className="text-sm">
                    {profile.chronicConditions?.length > 0 ? profile.chronicConditions.length : "None"}
                  </span>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => setLocation("/patient/profile")}>
                  Update Profile
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No health profile yet</p>
                <Button onClick={() => setLocation("/patient/profile")} data-testid="button-create-profile">
                  Create Health Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests?.slice(0, 3).map((request: any) => (
                <div key={request.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-chart-5" />
                  <div className="flex-1">
                    <p>Access request from <span className="font-medium">{request.requester}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(request.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline">{request.status}</Badge>
                </div>
              ))}
              {(!pendingRequests || pendingRequests.length === 0) && (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
