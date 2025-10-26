import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { Activity, Shield, FileText, QrCode, Heart, User, Loader2 } from "lucide-react";
export default function PatientAudit() {
    const { uid } = useWallet();
    const { data: logs, isLoading } = useQuery({
        queryKey: ["/api/patient/audit-logs"],
        enabled: !!uid,
    });
    const getActionIcon = (action) => {
        if (action.includes("access"))
            return Shield;
        if (action.includes("record"))
            return FileText;
        if (action.includes("qr"))
            return QrCode;
        if (action.includes("claim"))
            return Heart;
        return Activity;
    };
    const getActionColor = (action) => {
        if (action.includes("granted") || action.includes("approved"))
            return "text-chart-2";
        if (action.includes("rejected") || action.includes("revoked"))
            return "text-destructive";
        if (action.includes("requested") || action.includes("submitted"))
            return "text-chart-5";
        return "text-muted-foreground";
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Complete immutable history of all actions on your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Blockchain-verified audit trail of all access and modifications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : logs && logs.length > 0 ? (<div className="space-y-2">
              {logs.map((log, index) => {
                const Icon = getActionIcon(log.action);
                const color = getActionColor(log.action);
                return (<div key={log.id} className="flex items-start gap-3 p-3 rounded-md hover-elevate border" data-testid={`log-${log.id}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0 ${color}`}>
                      <Icon className="h-4 w-4"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm capitalize">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      {log.metadata && (<div className="text-xs text-muted-foreground space-y-1">
                          {log.metadata.requester && (<p className="flex items-center gap-1">
                              <User className="h-3 w-3"/>
                              <span>{log.metadata.requester}</span>
                            </p>)}
                          {log.metadata.reason && (<p className="italic">{log.metadata.reason}</p>)}
                        </div>)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                      </p>
                    </div>
                    {log.targetType && (<Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
                        {log.targetType}
                      </Badge>)}
                  </div>);
            })}
            </div>) : (<div className="text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <Activity className="h-8 w-8 text-muted-foreground"/>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Your audit trail will appear here as you use the platform
              </p>
            </div>)}
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4"/>
          About Audit Logs
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>All actions are recorded immutably on the blockchain</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Logs include timestamp, action type, and involved parties</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Use this to monitor who accessed your medical records</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Audit trails cannot be modified or deleted</span>
          </li>
        </ul>
      </div>
    </div>);
}
