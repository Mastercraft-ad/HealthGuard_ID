import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Check, X, Clock, User, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
export default function PatientAccess() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const { data: requests, isLoading } = useQuery({
        queryKey: ["/api/patient/access-requests"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const { data: granted } = useQuery({
        queryKey: ["/api/patient/access-granted"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const approveMutation = useMutation({
        mutationFn: (requestId) => apiRequest("POST", `/api/patient/access-requests/${requestId}/approve`, {}),
        onSuccess: () => {
            toast({ title: "Access Granted", description: "The requester can now view your records" });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/access-requests"] });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/access-granted"] });
        },
    });
    const rejectMutation = useMutation({
        mutationFn: (requestId) => apiRequest("POST", `/api/patient/access-requests/${requestId}/reject`, {}),
        onSuccess: () => {
            toast({ title: "Access Denied", description: "The request has been rejected" });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/access-requests"] });
        },
    });
    const revokeMutation = useMutation({
        mutationFn: (accessId) => apiRequest("POST", `/api/patient/access/${accessId}/revoke`, {}),
        onSuccess: () => {
            toast({ title: "Access Revoked", description: "The user can no longer view your records" });
            queryClient.invalidateQueries({ queryKey: ["/api/patient/access-granted"] });
        },
    });
    const pendingRequests = requests?.filter((r) => r.status === "pending") || [];
    const grantedAccess = granted?.filter((a) => a.status === "granted") || [];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access Control</h1>
        <p className="text-muted-foreground">Manage who can view your medical records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Granted Access</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-granted-count">{grantedAccess.length}</div>
            <p className="text-xs text-muted-foreground">Active permissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Access Requests</CardTitle>
          <CardDescription>Review and approve or deny requests to view your medical records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : pendingRequests.length > 0 ? (<div className="space-y-3">
              {pendingRequests.map((request) => (<Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground"/>
                          <span className="font-semibold" data-testid={`text-requester-${request.id}`}>
                            {request.requesterName || "Doctor"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {request.requesterRole || "doctor"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Requested: {new Date(request.requestedAt).toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs">
                            {request.accessType || "full"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveMutation.mutate(request.id)} disabled={approveMutation.isPending} className="gap-2" data-testid={`button-approve-${request.id}`}>
                          <Check className="h-3 w-3"/>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(request.id)} disabled={rejectMutation.isPending} data-testid={`button-reject-${request.id}`}>
                          <X className="h-3 w-3"/>
                          Deny
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>))}
            </div>) : (<div className="text-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                <Clock className="h-6 w-6 text-muted-foreground"/>
              </div>
              <p className="text-muted-foreground">No pending requests</p>
            </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Granted Access</CardTitle>
          <CardDescription>Users who currently have permission to view your records</CardDescription>
        </CardHeader>
        <CardContent>
          {grantedAccess.length > 0 ? (<div className="space-y-3">
              {grantedAccess.map((access) => (<Card key={access.id} data-testid={`card-granted-${access.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-2/10 text-chart-2">
                            <Check className="h-4 w-4"/>
                          </div>
                          <div>
                            <span className="font-semibold block">{access.requesterName || "Healthcare Provider"}</span>
                            <span className="text-xs text-muted-foreground">
                              {access.requesterRole || "doctor"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Granted: {new Date(access.respondedAt).toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {access.accessType || "full"}
                          </Badge>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`button-revoke-${access.id}`}>
                            Revoke Access
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately remove access to your medical records for this user. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeMutation.mutate(access.id)} className="bg-destructive hover:bg-destructive/90">
                              Revoke Access
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>))}
            </div>) : (<div className="text-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                <Shield className="h-6 w-6 text-muted-foreground"/>
              </div>
              <p className="text-muted-foreground">No active permissions</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
