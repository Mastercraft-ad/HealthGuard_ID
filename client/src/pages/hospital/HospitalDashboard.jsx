import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { Users, FileText, ClipboardList, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
export default function HospitalDashboard() {
    const { uid } = useWallet();
    const [, setLocation] = useLocation();
    const { data: claims } = useQuery({
        queryKey: ["/api/hospital/claims"],
        enabled: !!uid,
    });
    const { data: activityData } = useQuery({
        queryKey: ["/api/hospital/activity-logs"],
        enabled: !!uid,
    });
    const { data: patients } = useQuery({
        queryKey: ["/api/hospital/patients"],
        enabled: !!uid,
    });
    const pendingClaims = Array.isArray(claims) ? claims.filter((c) => c.status === "pending" || c.status === "under_review")?.length : 0;
    const approvedClaims = Array.isArray(claims) ? claims.filter((c) => c.status === "approved")?.length : 0;
    const totalRevenue = Array.isArray(claims) ? claims.filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + parseFloat(c.paidAmount || 0), 0) : 0;
    const treatedPatientsCount = patients?.length || 0;
    const totalTreatments = activityData?.totalTreatments || 0;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
        <p className="text-muted-foreground">Manage patients, invoices, and insurance claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-claims">{pendingClaims}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-approved-claims">{approvedClaims}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BDAG{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Paid claims</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treated Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-treated-patients">{treatedPatientsCount}</div>
            <p className="text-xs text-muted-foreground">{totalTreatments} total treatments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/hospital/patients")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-1/10 text-chart-1 mb-3">
              <Users className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">Manage Patients</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/hospital/invoices")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-2/10 text-chart-2 mb-3">
              <FileText className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">Generate Invoices</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/hospital/claims")}>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-5/10 text-chart-5 mb-3">
              <ClipboardList className="h-6 w-6"/>
            </div>
            <CardTitle className="text-base">Submit Claims</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>);
}
