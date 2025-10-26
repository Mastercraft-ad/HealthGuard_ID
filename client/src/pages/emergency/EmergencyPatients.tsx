import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, Loader2, Eye, AlertTriangle, Download } from "lucide-react";

export default function EmergencyPatients() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [viewRecordsDialogOpen, setViewRecordsDialogOpen] = useState(false);
  const [viewFileDialogOpen, setViewFileDialogOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/emergency/patients"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const { data: patientRecords, isLoading: isLoadingRecords } = useQuery<any[]>({
    queryKey: ["/api/emergency/patient", selectedPatient?.id, "records"],
    enabled: !!selectedPatient?.id,
    refetchInterval: 3000,
  });

  const { data: patientProfile } = useQuery<any>({
    queryKey: ["/api/emergency/patient", selectedPatient?.id, "profile"],
    enabled: !!selectedPatient?.id,
    refetchInterval: 5000,
  });

  const handleViewRecords = (patient: any) => {
    setSelectedPatient(patient);
    setViewRecordsDialogOpen(true);
  };

  const handleViewFile = (record: any) => {
    if (!record.fileData) {
      toast({
        title: "View Failed",
        description: "File data not available for this record",
        variant: "destructive"
      });
      return;
    }
    setViewingRecord(record);
    setViewFileDialogOpen(true);
  };

  const handleDownload = (record: any) => {
    if (!record.fileData) {
      toast({
        title: "Download Failed",
        description: "File data not available for this record",
        variant: "destructive"
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = record.fileData;
      link.download = record.fileName || `${record.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${record.fileName || record.title}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file",
        variant: "destructive"
      });
    }
  };

  const activePatients = patients?.length || 0;
  const totalRecords = patients?.reduce((sum, p) => sum + (p.recordCount || 0), 0) || 0;
  const emergencyAccess = patients?.filter(p => p.isEmergency)?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accessible Patients</h1>
        <p className="text-muted-foreground">Patients who have granted you access to their records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-patients">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : activePatients}
            </div>
            <p className="text-xs text-muted-foreground">With granted access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-total-records">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalRecords}
            </div>
            <p className="text-xs text-muted-foreground">Total accessible records</p>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Emergency Access</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-emergency-access">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : emergencyAccess}
            </div>
            <p className="text-xs text-muted-foreground">Emergency grants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <CardDescription>All patients who have granted you access</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No patients with granted access yet</p>
              <p className="text-sm">Patients will appear here after they approve your access requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient UID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Access Granted</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                    <TableCell className="font-mono text-xs" data-testid="text-patient-uid">
                      {patient.uid}
                    </TableCell>
                    <TableCell className="font-medium" data-testid="text-patient-username">
                      {patient.username}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {patient.accessGrantedAt 
                        ? new Date(patient.accessGrantedAt).toLocaleDateString()
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.recordCount || 0} records</Badge>
                    </TableCell>
                    <TableCell>
                      {patient.isEmergency ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Emergency
                        </Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === "verified" ? "default" : "outline"}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewRecords(patient)}
                        data-testid={`button-view-records-${patient.id}`}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Records
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewRecordsDialogOpen} onOpenChange={setViewRecordsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Medical Records</DialogTitle>
            <DialogDescription>
              {selectedPatient?.username} ({selectedPatient?.uid})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {patientProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Blood Type</p>
                      <p className="font-medium">{patientProfile.bloodType || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Height/Weight</p>
                      <p className="font-medium">
                        {patientProfile.height ? `${patientProfile.height} cm` : "N/A"} / 
                        {patientProfile.weight ? ` ${patientProfile.weight} kg` : " N/A"}
                      </p>
                    </div>
                    {patientProfile.allergies?.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Allergies</p>
                        <p className="font-medium text-destructive">{patientProfile.allergies.join(", ")}</p>
                      </div>
                    )}
                    {patientProfile.chronicConditions?.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Chronic Conditions</p>
                        <p className="font-medium">{patientProfile.chronicConditions.join(", ")}</p>
                      </div>
                    )}
                    {patientProfile.currentMedications?.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Current Medications</p>
                        <p className="font-medium">{patientProfile.currentMedications.join(", ")}</p>
                      </div>
                    )}
                    {patientProfile.emergencyContact && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{patientProfile.emergencyContact} ({patientProfile.emergencyPhone})</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Medical Records</h3>
              {isLoadingRecords ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !patientRecords || patientRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No medical records available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {patientRecords.map((record: any) => (
                    <Card key={record.id} data-testid={`card-record-${record.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{record.title}</CardTitle>
                            <CardDescription>
                              {record.recordType.replace("_", " ")} • {new Date(record.uploadedAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          {record.isEmergency && (
                            <Badge variant="destructive" className="text-xs">Emergency</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {record.description && (
                          <p className="text-sm text-muted-foreground mb-4">{record.description}</p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2" 
                            onClick={() => handleViewFile(record)}
                            data-testid={`button-view-file-${record.id}`}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2" 
                            onClick={() => handleDownload(record)}
                            data-testid={`button-download-file-${record.id}`}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewFileDialogOpen} onOpenChange={setViewFileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingRecord?.title}</DialogTitle>
            <DialogDescription>
              {viewingRecord?.recordType.replace("_", " ")} • Uploaded {viewingRecord && new Date(viewingRecord.uploadedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewingRecord?.description && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{viewingRecord.description}</p>
              </div>
            )}
            <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
              {viewingRecord?.fileType === 'application/pdf' ? (
                <object
                  data={viewingRecord.fileData}
                  type="application/pdf"
                  className="w-full h-full"
                  aria-label={viewingRecord.title}
                >
                  <div className="flex flex-col items-center justify-center h-full bg-muted/30 p-8 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">PDF Viewer Not Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Your browser doesn't support embedded PDF viewing.
                    </p>
                    <Button 
                      onClick={() => handleDownload(viewingRecord)}
                      className="gap-2"
                      data-testid="button-download-from-viewer"
                    >
                      <Download className="h-4 w-4" />
                      Download to View
                    </Button>
                  </div>
                </object>
              ) : viewingRecord?.fileType === 'text/plain' ? (
                <div className="p-4 overflow-auto h-full bg-muted/30">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {viewingRecord.fileData && atob(viewingRecord.fileData.split(',')[1])}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-muted/30 p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                  <p className="text-muted-foreground mb-4">
                    This file type ({viewingRecord?.fileType}) cannot be previewed in the browser.
                  </p>
                  <Button 
                    onClick={() => handleDownload(viewingRecord)}
                    className="gap-2"
                    data-testid="button-download-from-viewer"
                  >
                    <Download className="h-4 w-4" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setViewFileDialogOpen(false)}
                data-testid="button-close-file-viewer"
              >
                Close
              </Button>
              <Button 
                onClick={() => handleDownload(viewingRecord)}
                className="gap-2"
                data-testid="button-download-from-file-viewer-footer"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
