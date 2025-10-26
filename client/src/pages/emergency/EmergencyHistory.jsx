import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { QrCode, Activity, Clock } from "lucide-react";
export default function EmergencyHistory() {
    const { uid } = useWallet();
    const { data: scans, isLoading } = useQuery({
        queryKey: ["/api/emergency/scans"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const today = scans?.filter((s) => {
        const date = new Date(s.timestamp);
        const now = new Date();
        return date.toDateString() === now.toDateString();
    }) || [];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan History</h1>
        <p className="text-muted-foreground">Complete log of emergency QR code scans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{today.length}</div>
            <p className="text-xs text-muted-foreground">Scans today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Patients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {new Set(scans?.map((s) => s.targetId) || []).size}
            </div>
            <p className="text-xs text-muted-foreground">Different patients</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Emergency access log and audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : scans && scans.length > 0 ? (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (<TableRow key={scan.id}>
                    <TableCell className="font-mono text-xs">{scan.targetId?.slice(0, 12)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline">{scan.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{scan.ipAddress || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="default">Accessed</Badge>
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>) : (<div className="text-center py-12">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground">No scan history yet</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
