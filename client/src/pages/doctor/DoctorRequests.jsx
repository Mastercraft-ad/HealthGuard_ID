import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { Shield, Clock, CheckCircle, XCircle } from "lucide-react";
export default function DoctorRequests() {
    const { uid } = useWallet();
    const { data: requests, isLoading } = useQuery({
        queryKey: ["/api/doctor/access-requests"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const pending = requests?.filter((r) => r.status === "pending") || [];
    const granted = requests?.filter((r) => r.status === "granted") || [];
    const rejected = requests?.filter((r) => r.status === "rejected") || [];
    const statusBadge = (status) => {
        const variants = {
            pending: { variant: "secondary", icon: Clock, label: "Pending" },
            granted: { variant: "default", icon: CheckCircle, label: "Granted" },
            rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
        };
        const config = variants[status] || { variant: "outline", icon: Shield, label: status };
        const Icon = config.icon;
        return (<Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3"/>
        {config.label}
      </Badge>);
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access Requests</h1>
        <p className="text-muted-foreground">Track your patient record access requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{pending.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Granted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{granted.length}</div>
            <p className="text-xs text-muted-foreground">Active access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejected.length}</div>
            <p className="text-xs text-muted-foreground">Denied requests</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Access Requests</CardTitle>
          <CardDescription>Complete history of your access requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : requests && requests.length > 0 ? (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Patient UID</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (<TableRow key={request.id}>
                    <TableCell className="font-medium">{request.patientUsername || "Unknown"}</TableCell>
                    <TableCell className="font-mono text-xs">{request.patientUid || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.accessType}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {request.reason || "-"}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>) : (<div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground">No access requests yet</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
