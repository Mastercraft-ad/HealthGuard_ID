import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { Activity, Shield, FileCheck, UserPlus } from "lucide-react";
export default function AdminAudit() {
    const { uid } = useWallet();
    const { data: logs, isLoading } = useQuery({
        queryKey: ["/api/admin/audit-logs"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const actionIcons = {
        user_registered: UserPlus,
        kyc_submitted: FileCheck,
        access_granted: Shield,
        access_revoked: Shield,
        record_added: FileCheck,
    };
    const actionColors = {
        user_registered: "bg-green-500/10 text-green-500",
        kyc_submitted: "bg-blue-500/10 text-blue-500",
        access_granted: "bg-purple-500/10 text-purple-500",
        access_revoked: "bg-red-500/10 text-red-500",
        record_added: "bg-orange-500/10 text-orange-500",
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">System-wide activity monitoring and compliance tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs?.filter((log) => {
            const date = new Date(log.timestamp);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs?.filter((log) => log.action.includes("access")).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Access changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Added</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs?.filter((log) => log.action === "record_added").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Medical records</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Complete audit trail of system events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : logs && logs.length > 0 ? (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 50).map((log) => {
                const Icon = actionIcons[log.action] || Activity;
                return (<TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4"/>
                          <Badge className={actionColors[log.action] || ""}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.userId?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm">
                        {log.targetType ? `${log.targetType}: ${log.targetId?.slice(0, 8)}...` : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>);
            })}
              </TableBody>
            </Table>) : (<div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground">No audit logs found</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
