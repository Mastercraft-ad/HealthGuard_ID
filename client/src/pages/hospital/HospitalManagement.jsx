import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Stethoscope, Search, Loader2, User, Activity, Calendar, UserPlus, UserMinus, Phone, Droplet, Eye, Ambulance } from "lucide-react";
export default function HospitalManagement() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [patientSearch, setPatientSearch] = useState("");
    const [doctorSearch, setDoctorSearch] = useState("");
    const [responderSearch, setResponderSearch] = useState("");
    const [admitDialogOpen, setAdmitDialogOpen] = useState(false);
    const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [viewPatientDialogOpen, setViewPatientDialogOpen] = useState(false);
    const [viewDoctorDialogOpen, setViewDoctorDialogOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [admissionData, setAdmissionData] = useState({
        admissionReason: "",
        doctorId: undefined,
        roomNumber: "",
        ward: "",
    });
    const [dischargeNotes, setDischargeNotes] = useState("");
    const { data: patients, isLoading: loadingPatients } = useQuery({
        queryKey: ["/api/hospital/all-patients"],
        enabled: !!uid,
    });
    const { data: doctors, isLoading: loadingDoctors } = useQuery({
        queryKey: ["/api/hospital/all-doctors"],
        enabled: !!uid,
    });
    const { data: emergencyResponders, isLoading: loadingResponders } = useQuery({
        queryKey: ["/api/hospital/all-emergency-responders"],
        enabled: !!uid,
    });
    const admitPatientMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest("POST", "/api/hospital/admit-patient", data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/all-patients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/patients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
            toast({ title: "Success", description: "Patient admitted successfully" });
            setAdmitDialogOpen(false);
            setAdmissionData({ admissionReason: "", doctorId: undefined, roomNumber: "", ward: "" });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
    const dischargePatientMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest("POST", "/api/hospital/discharge-patient", data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/all-patients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/patients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
            toast({ title: "Success", description: "Patient discharged successfully" });
            setDischargeDialogOpen(false);
            setDischargeNotes("");
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
    const handleAdmitPatient = () => {
        if (selectedPatient) {
            const payload = {
                patientId: selectedPatient.id,
                admissionReason: admissionData.admissionReason,
                roomNumber: admissionData.roomNumber,
                ward: admissionData.ward,
            };
            // Only include doctorId if a valid doctor is selected
            if (admissionData.doctorId && admissionData.doctorId !== "none") {
                payload.doctorId = admissionData.doctorId;
            }
            admitPatientMutation.mutate(payload);
        }
    };
    const handleDischargePatient = () => {
        if (selectedPatient?.admissionStatus) {
            dischargePatientMutation.mutate({
                admissionId: selectedPatient.admissionStatus.id,
                dischargeNotes,
            });
        }
    };
    const filteredPatients = patients?.filter((patient) => patient.username?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        patient.uid?.toLowerCase().includes(patientSearch.toLowerCase()));
    const filteredDoctors = doctors?.filter((doctor) => doctor.username?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()));
    const filteredResponders = emergencyResponders?.filter((responder) => responder.username?.toLowerCase().includes(responderSearch.toLowerCase()) ||
        responder.professionalLicense?.toLowerCase().includes(responderSearch.toLowerCase()));
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hospital Management</h1>
        <p className="text-muted-foreground">Manage patients and doctors in your hospital</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-patients">
              {loadingPatients ? <Loader2 className="h-6 w-6 animate-spin"/> : (patients?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Registered patients in your hospital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-doctors">
              {loadingDoctors ? <Loader2 className="h-6 w-6 animate-spin"/> : (doctors?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active doctors in your hospital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Responders</CardTitle>
            <Ambulance className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-responders">
              {loadingResponders ? <Loader2 className="h-6 w-6 animate-spin"/> : (emergencyResponders?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active emergency responders</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patients" data-testid="tab-patients">
            <Users className="h-4 w-4 mr-2"/>
            Patients {patients && `(${patients.length})`}
          </TabsTrigger>
          <TabsTrigger value="doctors" data-testid="tab-doctors">
            <Stethoscope className="h-4 w-4 mr-2"/>
            Doctors {doctors && `(${doctors.length})`}
          </TabsTrigger>
          <TabsTrigger value="responders" data-testid="tab-responders">
            <Ambulance className="h-4 w-4 mr-2"/>
            Emergency Responders {emergencyResponders && `(${emergencyResponders.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patients Directory</CardTitle>
                  <CardDescription>All patients registered in your hospital</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search patients..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="pl-10" data-testid="input-search-patients"/>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPatients ? (<div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>) : filteredPatients && filteredPatients.length > 0 ? (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-center">Treatments</TableHead>
                      <TableHead>Admission Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (<TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={patient.profilePicture} alt={patient.username}/>
                              <AvatarFallback>
                                {patient.username?.slice(0, 2).toUpperCase() || "PT"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{patient.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {patient.fullName || "Name not available"}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {patient.uid?.slice(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {patient.phoneNumber && (<div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3"/>
                                {patient.phoneNumber}
                              </div>)}
                            {patient.bloodType && (<div className="flex items-center gap-1 text-xs">
                                <Droplet className="h-3 w-3"/>
                                {patient.bloodType}
                              </div>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Activity className="h-3 w-3"/>
                            {patient.treatmentCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {patient.isAdmitted ? (<div className="space-y-1">
                              <Badge variant="default" className="gap-1">
                                <User className="h-3 w-3"/>
                                Admitted
                              </Badge>
                              {patient.admissionStatus?.roomNumber && (<p className="text-xs text-muted-foreground">
                                  Room: {patient.admissionStatus.roomNumber}
                                </p>)}
                            </div>) : (<Badge variant="outline">Not Admitted</Badge>)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={patient.status === "verified" ? "default" : "outline"}>
                            {patient.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                    setSelectedPatient(patient);
                    setViewPatientDialogOpen(true);
                }}>
                              <Eye className="h-4 w-4 mr-1"/>
                              View
                            </Button>
                            {patient.isAdmitted ? (<Button size="sm" variant="destructive" onClick={() => {
                        setSelectedPatient(patient);
                        setDischargeDialogOpen(true);
                    }}>
                                <UserMinus className="h-4 w-4 mr-1"/>
                                Discharge
                              </Button>) : (<Button size="sm" variant="default" onClick={() => {
                        setSelectedPatient(patient);
                        setAdmitDialogOpen(true);
                    }}>
                                <UserPlus className="h-4 w-4 mr-1"/>
                                Admit
                              </Button>)}
                          </div>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>) : (<div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                  <p>No patients found</p>
                </div>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Doctors Directory</CardTitle>
                  <CardDescription>All doctors working in your hospital</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search doctors..." value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} className="pl-10" data-testid="input-search-doctors"/>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDoctors ? (<div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>) : filteredDoctors && filteredDoctors.length > 0 ? (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Doctor ID</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead className="text-center">Treatments</TableHead>
                      <TableHead className="text-center">Patients</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (<TableRow key={doctor.id} data-testid={`row-doctor-${doctor.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={doctor.profilePicture} alt={doctor.username}/>
                              <AvatarFallback>
                                <Stethoscope className="h-4 w-4"/>
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{doctor.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {doctor.specialization || "General Practice"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {doctor.uid?.slice(0, 16)}...
                        </TableCell>
                        <TableCell>
                          {doctor.specialization ? (<Badge variant="outline">{doctor.specialization}</Badge>) : (<span className="text-muted-foreground text-sm">General Practice</span>)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Activity className="h-3 w-3"/>
                            {doctor.treatmentCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3"/>
                            {doctor.patientCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3"/>
                            {doctor.lastActivity
                    ? new Date(doctor.lastActivity).toLocaleDateString()
                    : "No activity"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={doctor.status === "verified" ? "default" : "outline"}>
                            {doctor.status}
                          </Badge>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>) : (<div className="text-center py-8 text-muted-foreground">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                  <p>No doctors found</p>
                </div>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responders" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Emergency Responders Directory</CardTitle>
                  <CardDescription>All emergency responders affiliated with your hospital</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search responders..." value={responderSearch} onChange={(e) => setResponderSearch(e.target.value)} className="pl-10" data-testid="input-search-responders"/>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingResponders ? (<div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>) : filteredResponders && filteredResponders.length > 0 ? (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>UID</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponders.map((responder) => (<TableRow key={responder.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {responder.username?.charAt(0).toUpperCase() || "R"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{responder.username}</p>
                              <p className="text-xs text-muted-foreground">Emergency Responder</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {responder.uid?.slice(0, 16)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{responder.professionalLicense || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3"/>
                            {responder.joinedAt
                    ? new Date(responder.joinedAt).toLocaleDateString()
                    : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={responder.status === "verified" ? "default" : "outline"}>
                            {responder.status}
                          </Badge>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>) : (<div className="text-center py-8 text-muted-foreground">
                  <Ambulance className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                  <p>No emergency responders found</p>
                </div>)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admit Patient Dialog */}
      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admit Patient</DialogTitle>
            <DialogDescription>
              Admit {selectedPatient?.username} to the hospital
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admission-reason">Admission Reason *</Label>
              <Textarea id="admission-reason" placeholder="Enter reason for admission" value={admissionData.admissionReason} onChange={(e) => setAdmissionData({ ...admissionData, admissionReason: e.target.value })} required data-testid="input-admission-reason"/>
            </div>
            <div>
              <Label htmlFor="assigned-doctor">Assign Doctor (Optional)</Label>
              <Select value={admissionData.doctorId || "none"} onValueChange={(value) => setAdmissionData({
            ...admissionData,
            doctorId: value === "none" ? undefined : value
        })}>
                <SelectTrigger id="assigned-doctor" data-testid="select-assigned-doctor">
                  <SelectValue placeholder="Select a doctor to treat this patient"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No doctor assigned</SelectItem>
                  {doctors?.map((doctor) => (<SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.username} - {doctor.specialization || "General Practice"}
                    </SelectItem>))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Assign a doctor to be responsible for treating this patient
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room-number">Room Number</Label>
                <Input id="room-number" placeholder="e.g., 201" value={admissionData.roomNumber} onChange={(e) => setAdmissionData({ ...admissionData, roomNumber: e.target.value })} data-testid="input-room-number"/>
              </div>
              <div>
                <Label htmlFor="ward">Ward</Label>
                <Input id="ward" placeholder="e.g., ICU, General" value={admissionData.ward} onChange={(e) => setAdmissionData({ ...admissionData, ward: e.target.value })} data-testid="input-ward"/>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdmitPatient} disabled={!admissionData.admissionReason || admitPatientMutation.isPending}>
              {admitPatientMutation.isPending ? "Admitting..." : "Admit Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge Patient Dialog */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discharge Patient</DialogTitle>
            <DialogDescription>
              Discharge {selectedPatient?.username} from the hospital
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatient?.admissionStatus && (<Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <p><strong>Admission Date:</strong> {new Date(selectedPatient.admissionStatus.admissionDate).toLocaleString()}</p>
                  {selectedPatient.admissionStatus.roomNumber && (<p><strong>Room:</strong> {selectedPatient.admissionStatus.roomNumber}</p>)}
                  {selectedPatient.admissionStatus.ward && (<p><strong>Ward:</strong> {selectedPatient.admissionStatus.ward}</p>)}
                  {selectedPatient.admissionStatus.admissionReason && (<p><strong>Admission Reason:</strong> {selectedPatient.admissionStatus.admissionReason}</p>)}
                </CardContent>
              </Card>)}
            <div>
              <Label htmlFor="discharge-notes">Discharge Notes</Label>
              <Textarea id="discharge-notes" placeholder="Enter discharge summary and notes" value={dischargeNotes} onChange={(e) => setDischargeNotes(e.target.value)} rows={4}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDischargeDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDischargePatient} disabled={dischargePatientMutation.isPending}>
              {dischargePatientMutation.isPending ? "Discharging..." : "Discharge Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Patient Details Dialog */}
      <Dialog open={viewPatientDialogOpen} onOpenChange={setViewPatientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Complete information for {selectedPatient?.username}</DialogDescription>
          </DialogHeader>
          {selectedPatient && (<div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPatient.profilePicture} alt={selectedPatient.username}/>
                  <AvatarFallback>{selectedPatient.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedPatient.username}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPatient.fullName || "Name not available"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedPatient.uid}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Phone:</strong> {selectedPatient.phoneNumber || "N/A"}</p>
                    <p><strong>Email:</strong> {selectedPatient.email || "N/A"}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Medical Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Blood Type:</strong> {selectedPatient.bloodType || "N/A"}</p>
                    <p><strong>Status:</strong> <Badge variant={selectedPatient.status === "verified" ? "default" : "outline"}>{selectedPatient.status}</Badge></p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Treatment History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Total Treatments:</strong> {selectedPatient.treatmentCount || 0}</p>
                    {selectedPatient.lastTreatment && (<>
                        <p><strong>Last Visit:</strong> {new Date(selectedPatient.lastTreatment.date).toLocaleDateString()}</p>
                        <p><strong>Diagnosis:</strong> {selectedPatient.lastTreatment.diagnosis}</p>
                      </>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Admission Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {selectedPatient.isAdmitted ? (<>
                        <Badge variant="default">Currently Admitted</Badge>
                        {selectedPatient.admissionStatus?.roomNumber && (<p><strong>Room:</strong> {selectedPatient.admissionStatus.roomNumber}</p>)}
                        {selectedPatient.admissionStatus?.ward && (<p><strong>Ward:</strong> {selectedPatient.admissionStatus.ward}</p>)}
                        {selectedPatient.admissionStatus?.admissionDate && (<p><strong>Since:</strong> {new Date(selectedPatient.admissionStatus.admissionDate).toLocaleDateString()}</p>)}
                      </>) : (<Badge variant="outline">Not Admitted</Badge>)}
                  </CardContent>
                </Card>
              </div>
            </div>)}
          <DialogFooter>
            <Button onClick={() => setViewPatientDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
