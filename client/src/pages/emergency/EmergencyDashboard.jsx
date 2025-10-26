import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { QrCode, Activity, AlertTriangle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
export default function EmergencyDashboard() {
    const { uid } = useWallet();
    const [, setLocation] = useLocation();
    const { data: scans } = useQuery({
        queryKey: ["/api/emergency/scans"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const todayScans = scans?.filter((s) => {
        const scanDate = new Date(s.scannedAt);
        const today = new Date();
        return scanDate.toDateString() === today.toDateString();
    }).length || 0;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Responder</h1>
        <p className="text-muted-foreground">Quick access to critical patient information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Scans</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-scans">{todayScans}</div>
            <p className="text-xs text-muted-foreground">QR codes scanned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Emergency Mode</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">ACTIVE</div>
            <p className="text-xs text-muted-foreground">Fast access enabled</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive"/>
            <CardTitle>Quick Scan Access</CardTitle>
          </div>
          <CardDescription>Scan patient QR code for immediate critical information</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full gap-2 bg-destructive hover:bg-destructive/90" onClick={() => setLocation("/emergency/scan")} data-testid="button-scan-qr">
            <QrCode className="h-5 w-5"/>
            Scan Emergency QR Code
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Latest patient emergency accesses</CardDescription>
        </CardHeader>
        <CardContent>
          {scans && scans.length > 0 ? (<div className="space-y-3">
              {scans.slice(0, 5).map((scan) => (<div key={scan.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="font-medium font-mono">{scan.patientUid}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.scannedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/emergency/scan?uid=${scan.patientUid}`)}>
                    View Details
                  </Button>
                </div>))}
            </div>) : (<p className="text-center text-muted-foreground py-8">No scans yet</p>)}
        </CardContent>
      </Card>
    </div>);
}
