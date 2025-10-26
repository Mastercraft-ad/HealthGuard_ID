import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, User, Clock, FileText, Image as ImageIcon } from "lucide-react";
export default function HospitalAccessRequests() {
    const { uid } = useWallet();
    const { data: accessRequests, isLoading } = useQuery({
        queryKey: ["/api/hospital/access-requests"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const emergencyRequests = Array.isArray(accessRequests) ? accessRequests : [];
    const statusBadge = (status) => {
        const variants = {
            pending: { variant: "secondary", label: "Pending" },
            granted: { variant: "default", label: "Granted" },
            revoked: { variant: "destructive", label: "Revoked" },
            rejected: { variant: "outline", label: "Rejected" },
        };
        const config = variants[status] || { variant: "outline", label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Access Requests</h1>
        <p className="text-muted-foreground">
          View emergency access requests for your hospital's patients
        </p>
      </div>

      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4"/>
        <AlertDescription>
          These are emergency access requests for patients registered at your hospital.
          Final approval must be granted by the patient themselves.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-requests">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : emergencyRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">Emergency requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending">
              {isLoading ? (<Loader2 className="h-6 w-6 animate-spin"/>) : (emergencyRequests.filter((r) => r.status === "pending").length)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting patient approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Granted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-granted">
              {isLoading ? (<Loader2 className="h-6 w-6 animate-spin"/>) : (emergencyRequests.filter((r) => r.status === "granted").length)}
            </div>
            <p className="text-xs text-muted-foreground">Approved by patient</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (<div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
        </div>) : emergencyRequests.length === 0 ? (<Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground"/>
            <h3 className="text-lg font-semibold mb-2">No Emergency Access Requests</h3>
            <p className="text-muted-foreground">
              No emergency access requests have been made for patients at your hospital
            </p>
          </CardContent>
        </Card>) : (<div className="space-y-4">
          {emergencyRequests.map((request) => (<Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={request.patientProfilePicture} alt={request.patientName}/>
                      <AvatarFallback>
                        <User className="h-8 w-8"/>
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">Patient: {request.patientName}</CardTitle>
                      <CardDescription className="font-mono text-sm">{request.patientUid}</CardDescription>
                    </div>
                  </div>
                  {statusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Requester Information</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.requesterProfilePicture} alt={request.requesterName}/>
                        <AvatarFallback className="text-xs">
                          <User className="h-4 w-4"/>
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-requester-name-${request.id}`}>
                          {request.requesterName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{request.requesterRole}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Request Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="destructive">Emergency</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested:</span>
                        <span data-testid={`text-requested-at-${request.id}`}>
                          {new Date(request.requestedAt).toLocaleString()}
                        </span>
                      </div>
                      {request.respondedAt && (<div className="flex justify-between">
                          <span className="text-muted-foreground">Responded:</span>
                          <span>{new Date(request.respondedAt).toLocaleString()}</span>
                        </div>)}
                    </div>
                  </div>
                </div>

                {request.reason && (<div>
                    <h4 className="font-semibold mb-2">Reason</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md" data-testid={`text-reason-${request.id}`}>
                      {request.reason}
                    </p>
                  </div>)}

                {request.proofDetails && (<div>
                    <h4 className="font-semibold mb-2">Proof Details</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md" data-testid={`text-proof-details-${request.id}`}>
                      {request.proofDetails}
                    </p>
                  </div>)}

                {request.proofImage && (<div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4"/>
                      Proof Image
                    </h4>
                    <div className="border rounded-lg p-2 bg-muted">
                      <img src={request.proofImage} alt="Emergency proof" className="max-h-64 mx-auto rounded" data-testid={`img-proof-${request.id}`}/>
                    </div>
                  </div>)}

                <Alert>
                  <AlertTriangle className="h-4 w-4"/>
                  <AlertDescription>
                    This request was automatically shared with your hospital due to its emergency nature.
                    The patient has final authority to grant or revoke access.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>))}
        </div>)}
    </div>);
}
