import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCog, CheckCircle, XCircle, Shield } from "lucide-react";

export default function AdminRoles() {
  const { uid } = useWallet();
  const { toast } = useToast();

  const { data: applications, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/role-applications"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({ title: "Role Granted", description: "User role has been updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-applications"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return apiRequest("POST", `/api/admin/kyc/${applicationId}/reject`, { reason: "Application denied" });
    },
    onSuccess: () => {
      toast({ title: "Application Rejected", description: "User has been notified" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-applications"] });
    },
  });

  const pending = applications?.filter((a: any) => a.status === "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-role-management">Role Management</h1>
        <p className="text-muted-foreground">Review and approve role change applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="count-pending-applications">{pending.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="count-total-applications">{applications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Applications</CardTitle>
          <CardDescription>Users requesting professional role upgrades</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-applications">Loading...</div>
          ) : pending.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>License/Institution</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((app: any) => {
                  const requestedRole = app.requestedRole || "doctor";
                  const roleDisplay = requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1).replace(/_/g, " ");
                  
                  return (
                    <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                      <TableCell className="font-medium" data-testid={`text-applicant-name-${app.id}`}>{app.fullName}</TableCell>
                      <TableCell>
                        <Badge data-testid={`badge-role-${app.id}`}>{roleDisplay}</Badge>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-license-${app.id}`}>
                        {app.professionalLicense || app.institutionName || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-${app.id}`}>
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ userId: app.userId, role: requestedRole })}
                            disabled={approveMutation.isPending}
                            className="gap-1"
                            data-testid={`button-approve-role-${app.id}`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(app.id)}
                            disabled={rejectMutation.isPending}
                            className="gap-1"
                            data-testid={`button-reject-role-${app.id}`}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-pending-applications">No pending role applications</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
