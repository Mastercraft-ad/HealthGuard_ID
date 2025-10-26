import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { Users, Shield, FileCheck, Search, Activity, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function DoctorDashboard() {
  const { uid } = useWallet();
  const [, setLocation] = useLocation();

  const { data: requests } = useQuery<any[]>({
    queryKey: ["/api/doctor/access-requests"],
    enabled: !!uid,
  });

  const { data: treatments } = useQuery<any[]>({
    queryKey: ["/api/doctor/treatments"],
    enabled: !!uid,
  });

  const { data: patients } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients"],
    enabled: !!uid,
  });

  const pendingCount = requests?.filter((r: any) => r.status === "pending")?.length || 0;
  const treatmentCount = treatments?.length || 0;
  const grantedCount = requests?.filter((r: any) => r.status === "granted")?.length || 0;
  const assignedPatientsCount = patients?.filter((p: any) => p.isAssigned)?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Manage patient access and treatment records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
            <Users className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1" data-testid="text-assigned-patients">{assignedPatientsCount}</div>
            <p className="text-xs text-muted-foreground">Patients assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-requests">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting patient approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-patients">{grantedCount}</div>
            <p className="text-xs text-muted-foreground">With granted access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Logs</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-treatment-count">{treatmentCount}</div>
            <p className="text-xs text-muted-foreground">Signed records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treatments?.filter((t: any) => {
                const date = new Date(t.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Consultations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/doctor/search")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-1/10 text-chart-1 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">Search Patients</CardTitle>
            <CardDescription>Find patients by UID or username to request access</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/doctor/requests")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-5/10 text-chart-5 mb-3">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">Access Requests</CardTitle>
            <CardDescription>View pending and approved access requests</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/doctor/treatments")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-2/10 text-chart-2 mb-3">
              <FileCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">Treatment Logs</CardTitle>
            <CardDescription>View and create signed treatment records</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Access Requests</CardTitle>
          <CardDescription>Latest patient record access requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="font-medium">Patient UID: {request.patientUid}</p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      request.status === "granted" ? "bg-chart-2/10 text-chart-2" :
                      request.status === "pending" ? "bg-chart-5/10 text-chart-5" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No access requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
