import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, FileText, Loader2, Send, Activity, BedDouble } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function HospitalPatients() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestReason, setRequestReason] = useState("");

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/hospital/patients"],
    enabled: !!uid,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const walletAddress = localStorage.getItem("walletAddress");
      const response = await fetch(`/api/hospital/search-patient?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          ...(walletAddress ? { "x-wallet-address": walletAddress } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResult(data);
        setSearchDialogOpen(true);
      } else {
        toast({ 
          title: "Not Found", 
          description: "No patient found with that UID or username", 
          variant: "destructive" 
        });
        setSearchResult(null);
      }
    } catch (error) {
      toast({ 
        title: "Search Failed", 
        description: "Unable to search for patient", 
        variant: "destructive" 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const requestAccessMutation = useMutation({
    mutationFn: (data: { patientId: string; reason: string }) =>
      apiRequest("POST", "/api/hospital/request-access", data),
    onSuccess: () => {
      toast({ 
        title: "Access Requested", 
        description: "Patient will receive your request for approval" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospital/access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hospital/patients"] });
      setRequestDialogOpen(false);
      setRequestReason("");
      setSearchDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to send access request";
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  const handleRequestAccess = () => {
    if (!searchResult || !requestReason.trim()) return;
    requestAccessMutation.mutate({
      patientId: searchResult.id,
      reason: requestReason,
    });
  };

  const activePatients = patients?.length || 0;
  const admittedPatients = patients?.filter(p => p.isAdmitted) || [];
  const treatedPatients = patients?.filter(p => p.isTreated) || [];
  const latestPatient = patients && patients.length > 0 ? patients[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hospital Patients</h1>
        <p className="text-muted-foreground">Manage patient admissions and records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-patients">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : activePatients}
            </div>
            <p className="text-xs text-muted-foreground">Total patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Admitted</CardTitle>
            <BedDouble className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1" data-testid="text-admitted-patients">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : admittedPatients.length}
            </div>
            <p className="text-xs text-muted-foreground">Admitted patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treated Patients</CardTitle>
            <Activity className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-treated-patients">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : treatedPatients.length}
            </div>
            <p className="text-xs text-muted-foreground">Received treatment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-treatment-count">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (patients?.reduce((sum, p) => sum + (p.treatmentCount || 0), 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total treatments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Search Patient</CardTitle>
              <CardDescription>Find patients by UID or username</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Enter UID or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-patient"
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSearching}
              data-testid="button-search"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <CardDescription>View patients by admission and treatment status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No patients found</p>
              <p className="text-sm">Patients will appear here after admission or treatment</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all-patients">
                  All Patients ({activePatients})
                </TabsTrigger>
                <TabsTrigger value="admitted" data-testid="tab-admitted-patients">
                  Currently Admitted ({admittedPatients.length})
                </TabsTrigger>
                <TabsTrigger value="treated" data-testid="tab-treated-patients">
                  Treated ({treatedPatients.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient UID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Admission Status</TableHead>
                      <TableHead>Assigned Doctor</TableHead>
                      <TableHead>Treatments</TableHead>
                      <TableHead>Last Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                        <TableCell className="font-mono text-xs">{patient.uid}</TableCell>
                        <TableCell className="font-medium">{patient.username}</TableCell>
                        <TableCell>
                          {patient.admissionStatus ? (
                            <Badge variant={patient.admissionStatus === "admitted" ? "default" : "secondary"}>
                              {patient.admissionStatus}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">No admission</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {patient.assignedDoctor ? patient.assignedDoctor.username : "Not assigned"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{patient.treatmentCount || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="admitted" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient UID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Admission Date</TableHead>
                      <TableHead>Assigned Doctor</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admittedPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No currently admitted patients
                        </TableCell>
                      </TableRow>
                    ) : (
                      admittedPatients.map((patient) => (
                        <TableRow key={patient.id} data-testid={`row-admitted-${patient.id}`}>
                          <TableCell className="font-mono text-xs">{patient.uid}</TableCell>
                          <TableCell className="font-medium">{patient.username}</TableCell>
                          <TableCell className="text-sm">
                            {patient.admissionDate ? new Date(patient.admissionDate).toLocaleString() : "N/A"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {patient.assignedDoctor ? patient.assignedDoctor.username : "Not assigned"}
                          </TableCell>
                          <TableCell>{patient.roomNumber || "N/A"}</TableCell>
                          <TableCell>{patient.ward || "N/A"}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {patient.admissionReason || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="treated" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient UID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Assigned Doctor</TableHead>
                      <TableHead>Treatment Count</TableHead>
                      <TableHead>Last Treatment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatedPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No treated patients yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      treatedPatients.map((patient) => (
                        <TableRow key={patient.id} data-testid={`row-treated-${patient.id}`}>
                          <TableCell className="font-mono text-xs">{patient.uid}</TableCell>
                          <TableCell className="font-medium">{patient.username}</TableCell>
                          <TableCell className="text-sm">
                            {patient.assignedDoctor ? patient.assignedDoctor.username : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{patient.treatmentCount || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Treated</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Patient information and treatment history</DialogDescription>
          </DialogHeader>
          {searchResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient UID</p>
                  <p className="font-mono font-medium">{searchResult.uid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{searchResult.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={searchResult.status === "verified" ? "default" : "outline"}>
                    {searchResult.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Treatment Count</p>
                  <p className="font-semibold">{searchResult.treatmentCount || 0} treatments</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claims Filed</p>
                  <p className="font-semibold">{searchResult.claimCount || 0} claims</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                  <p className="font-medium">
                    {searchResult.lastVisit 
                      ? new Date(searchResult.lastVisit).toLocaleDateString()
                      : "N/A"
                    }
                  </p>
                </div>
              </div>
              <Button
                className="w-full gap-2 mt-4"
                onClick={() => {
                  setSearchDialogOpen(false);
                  setRequestDialogOpen(true);
                }}
                data-testid="button-request-access"
              >
                <Send className="h-4 w-4" />
                Request Access to Medical Records
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access</DialogTitle>
            <DialogDescription>
              Explain why you need access to this patient's medical records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access</Label>
              <Textarea
                id="reason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="e.g., Patient admitted for emergency surgery"
                rows={4}
                data-testid="input-access-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestAccess}
                disabled={!requestReason.trim() || requestAccessMutation.isPending}
                data-testid="button-submit-request"
              >
                {requestAccessMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
