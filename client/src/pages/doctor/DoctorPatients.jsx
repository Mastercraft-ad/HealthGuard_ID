import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, FileText, Loader2, Eye, Calendar, Download, Activity } from "lucide-react";
const treatmentFormSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    hospitalId: z.string().optional(),
    diagnosis: z.string().min(1, "Diagnosis is required"),
    treatment: z.string().min(1, "Treatment is required"),
    prescription: z.string().optional(),
    notes: z.string().optional(),
    treatmentDate: z.string().min(1, "Treatment date is required"),
});
export default function DoctorPatients() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [viewRecordsDialogOpen, setViewRecordsDialogOpen] = useState(false);
    const [viewFileDialogOpen, setViewFileDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
    const { data: patients, isLoading } = useQuery({
        queryKey: ["/api/doctor/patients"],
        enabled: !!uid,
    });
    const { data: patientRecords, isLoading: isLoadingRecords } = useQuery({
        queryKey: ["/api/doctor/patient", selectedPatient?.id, "records"],
        enabled: !!selectedPatient?.id,
    });
    const { data: patientProfile } = useQuery({
        queryKey: ["/api/doctor/patient", selectedPatient?.id, "profile"],
        enabled: !!selectedPatient?.id,
    });
    const treatmentForm = useForm({
        resolver: zodResolver(treatmentFormSchema),
        defaultValues: {
            patientId: "",
            hospitalId: "",
            diagnosis: "",
            treatment: "",
            prescription: "",
            notes: "",
            treatmentDate: new Date().toISOString().split('T')[0],
        },
    });
    const createTreatmentMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest("POST", "/api/doctor/treatments", data);
        },
        onSuccess: () => {
            toast({
                title: "Treatment log created",
                description: "Treatment record has been saved successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/doctor/treatments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/patients"] });
            setTreatmentDialogOpen(false);
            treatmentForm.reset();
        },
        onError: (error) => {
            toast({
                title: "Failed to create treatment log",
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        },
    });
    const handleViewRecords = (patient) => {
        setSelectedPatient(patient);
        setViewRecordsDialogOpen(true);
    };
    const handleCreateTreatment = (patient) => {
        setSelectedPatient(patient);
        treatmentForm.setValue("patientId", patient.id);
        setTreatmentDialogOpen(true);
    };
    const handleViewFile = (record) => {
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
    const handleDownload = (record) => {
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
        }
        catch (error) {
            toast({
                title: "Download Failed",
                description: "Unable to download the file",
                variant: "destructive"
            });
        }
    };
    const activePatients = patients?.length || 0;
    const totalRecords = patients?.reduce((sum, p) => sum + (p.recordCount || 0), 0) || 0;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Patients</h1>
        <p className="text-muted-foreground">Patients who have granted you access to their records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-patients">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : activePatients}
            </div>
            <p className="text-xs text-muted-foreground">With granted access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-total-records">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : totalRecords}
            </div>
            <p className="text-xs text-muted-foreground">Total accessible records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3" data-testid="text-treatment-count">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : (patients?.reduce((sum, p) => sum + (p.treatmentCount || 0), 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <CardDescription>All patients who have granted you access</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : !patients || patients.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50"/>
              <p>No patients with granted access yet</p>
              <p className="text-sm">Patients will appear here after they approve your access requests</p>
            </div>) : (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient UID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Access Granted</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Treatments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (<TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                    <TableCell className="font-mono text-xs" data-testid="text-patient-uid">
                      {patient.uid}
                    </TableCell>
                    <TableCell className="font-medium" data-testid="text-patient-username">
                      {patient.username}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {patient.accessGrantedAt
                    ? new Date(patient.accessGrantedAt).toLocaleDateString()
                    : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.recordCount || 0} records</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.treatmentCount || 0} sessions</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === "verified" ? "default" : "outline"}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewRecords(patient)} data-testid={`button-view-records-${patient.id}`} className="gap-2">
                          <Eye className="h-4 w-4"/>
                          View Records
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleCreateTreatment(patient)} data-testid={`button-create-treatment-${patient.id}`} className="gap-2">
                          <Activity className="h-4 w-4"/>
                          Create Treatment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>)}
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
            {patientProfile && patientProfile.healthProfile && (<Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Blood Type</p>
                      <p className="font-medium">{patientProfile.healthProfile.bloodType || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Height/Weight</p>
                      <p className="font-medium">
                        {patientProfile.healthProfile.height ? `${patientProfile.healthProfile.height} cm` : "N/A"} / 
                        {patientProfile.healthProfile.weight ? ` ${patientProfile.healthProfile.weight} kg` : " N/A"}
                      </p>
                    </div>
                    {patientProfile.healthProfile.allergies?.length > 0 && (<div className="col-span-2">
                        <p className="text-muted-foreground">Allergies</p>
                        <p className="font-medium">{patientProfile.healthProfile.allergies.join(", ")}</p>
                      </div>)}
                    {patientProfile.healthProfile.chronicConditions?.length > 0 && (<div className="col-span-2">
                        <p className="text-muted-foreground">Chronic Conditions</p>
                        <p className="font-medium">{patientProfile.healthProfile.chronicConditions.join(", ")}</p>
                      </div>)}
                    {patientProfile.healthProfile.currentMedications?.length > 0 && (<div className="col-span-2">
                        <p className="text-muted-foreground">Current Medications</p>
                        <p className="font-medium">{patientProfile.healthProfile.currentMedications.join(", ")}</p>
                      </div>)}
                  </div>
                </CardContent>
              </Card>)}

            <div>
              <h3 className="text-lg font-semibold mb-4">Medical Records</h3>
              {isLoadingRecords ? (<div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>) : !patientRecords || patientRecords.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                  <p>No medical records available</p>
                </div>) : (<div className="grid grid-cols-1 gap-4">
                  {patientRecords.map((record) => (<Card key={record.id} data-testid={`card-record-${record.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{record.title}</CardTitle>
                            <CardDescription>
                              {record.recordType.replace("_", " ")} • {new Date(record.uploadedAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          {record.isEmergency && (<Badge variant="destructive" className="text-xs">Emergency</Badge>)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {record.description && (<p className="text-sm text-muted-foreground mb-4">{record.description}</p>)}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleViewFile(record)} data-testid={`button-view-file-${record.id}`}>
                            <Eye className="h-3 w-3"/>
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleDownload(record)} data-testid={`button-download-file-${record.id}`}>
                            <Download className="h-3 w-3"/>
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>))}
                </div>)}
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
            {viewingRecord?.description && (<div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{viewingRecord.description}</p>
              </div>)}
            <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
              {viewingRecord?.fileType === 'application/pdf' ? (<object data={viewingRecord.fileData} type="application/pdf" className="w-full h-full" aria-label={viewingRecord.title}>
                  <div className="flex flex-col items-center justify-center h-full bg-muted/30 p-8 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4"/>
                    <h3 className="text-lg font-semibold mb-2">PDF Viewer Not Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Your browser doesn't support embedded PDF viewing.
                    </p>
                    <Button onClick={() => handleDownload(viewingRecord)} className="gap-2" data-testid="button-download-from-viewer">
                      <Download className="h-4 w-4"/>
                      Download to View
                    </Button>
                  </div>
                </object>) : viewingRecord?.fileType === 'text/plain' ? (<div className="p-4 overflow-auto h-full bg-muted/30">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {viewingRecord.fileData && atob(viewingRecord.fileData.split(',')[1])}
                  </pre>
                </div>) : (<div className="flex flex-col items-center justify-center h-full bg-muted/30 p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                  <p className="text-muted-foreground mb-4">
                    This file type ({viewingRecord?.fileType}) cannot be previewed in the browser.
                  </p>
                  <Button onClick={() => handleDownload(viewingRecord)} className="gap-2" data-testid="button-download-from-viewer">
                    <Download className="h-4 w-4"/>
                    Download to View
                  </Button>
                </div>)}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewFileDialogOpen(false)} data-testid="button-close-file-viewer">
                Close
              </Button>
              <Button onClick={() => handleDownload(viewingRecord)} className="gap-2" data-testid="button-download-from-file-viewer-footer">
                <Download className="h-4 w-4"/>
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Treatment Log</DialogTitle>
            <DialogDescription>
              Record a new treatment for {selectedPatient?.username}
            </DialogDescription>
          </DialogHeader>
          <Form {...treatmentForm}>
            <form onSubmit={treatmentForm.handleSubmit((data) => createTreatmentMutation.mutate(data))} className="space-y-4">
              <FormField control={treatmentForm.control} name="treatmentDate" render={({ field }) => (<FormItem>
                    <FormLabel>Treatment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-treatment-date"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={treatmentForm.control} name="diagnosis" render={({ field }) => (<FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter diagnosis..." {...field} rows={2} data-testid="input-diagnosis"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={treatmentForm.control} name="treatment" render={({ field }) => (<FormItem>
                    <FormLabel>Treatment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the treatment provided..." {...field} rows={3} data-testid="input-treatment"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={treatmentForm.control} name="prescription" render={({ field }) => (<FormItem>
                    <FormLabel>Prescription (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter prescription details..." {...field} rows={2} data-testid="input-prescription"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={treatmentForm.control} name="notes" render={({ field }) => (<FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} rows={2} data-testid="input-notes"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={treatmentForm.control} name="hospitalId" render={({ field }) => (<FormItem>
                    <FormLabel>Hospital ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Hospital ID" {...field} data-testid="input-hospital-id"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setTreatmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTreatmentMutation.isPending} data-testid="button-submit-treatment">
                  {createTreatmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Create Treatment Log
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>);
}
