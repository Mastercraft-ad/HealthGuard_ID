import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileCheck, Activity, Users, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
const treatmentFormSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    doctorId: z.string().optional(),
    diagnosis: z.string().min(1, "Diagnosis is required"),
    treatment: z.string().min(1, "Treatment is required"),
    prescription: z.string().optional(),
    notes: z.string().optional(),
    treatmentDate: z.string().min(1, "Treatment date is required"),
});
export default function HospitalTreatments() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data: treatments, isLoading } = useQuery({
        queryKey: ["/api/hospital/treatments"],
        enabled: !!uid,
    });
    const form = useForm({
        resolver: zodResolver(treatmentFormSchema),
        defaultValues: {
            patientId: "",
            doctorId: "",
            diagnosis: "",
            treatment: "",
            prescription: "",
            notes: "",
            treatmentDate: new Date().toISOString().split('T')[0],
        },
    });
    const createTreatmentMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest("POST", "/api/hospital/treatments", data);
        },
        onSuccess: () => {
            toast({
                title: "Treatment log created",
                description: "Treatment record has been saved successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/treatments"] });
            setDialogOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({
                title: "Failed to create treatment log",
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        createTreatmentMutation.mutate(data);
    };
    const thisMonth = treatments?.filter((t) => {
        const date = new Date(t.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }) || [];
    const uniquePatients = new Set(treatments?.map((t) => t.patientId) || []).size;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Treatment Logs</h1>
        <p className="text-muted-foreground">Hospital treatment records and patient care logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Treatments</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{thisMonth.length}</div>
            <p className="text-xs text-muted-foreground">Recent treatments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{uniquePatients}</div>
            <p className="text-xs text-muted-foreground">Patients treated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Treatment History</CardTitle>
              <CardDescription>Complete record of hospital treatment logs</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-treatment">
                  <Plus className="h-4 w-4 mr-2"/>
                  Create Treatment Log
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Treatment Log</DialogTitle>
                  <DialogDescription>
                    Record a new treatment for a patient
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="patientId" render={({ field }) => (<FormItem>
                            <FormLabel>Patient ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Patient ID" {...field} data-testid="input-patient-id"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                      <FormField control={form.control} name="doctorId" render={({ field }) => (<FormItem>
                            <FormLabel>Doctor ID (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Doctor ID" {...field} data-testid="input-doctor-id"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                    </div>

                    <FormField control={form.control} name="treatmentDate" render={({ field }) => (<FormItem>
                          <FormLabel>Treatment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-treatment-date"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <FormField control={form.control} name="diagnosis" render={({ field }) => (<FormItem>
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter diagnosis..." {...field} rows={2} data-testid="input-diagnosis"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <FormField control={form.control} name="treatment" render={({ field }) => (<FormItem>
                          <FormLabel>Treatment</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the treatment provided..." {...field} rows={3} data-testid="input-treatment"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <FormField control={form.control} name="prescription" render={({ field }) => (<FormItem>
                          <FormLabel>Prescription (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter prescription details..." {...field} rows={2} data-testid="input-prescription"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <FormField control={form.control} name="notes" render={({ field }) => (<FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional notes..." {...field} rows={2} data-testid="input-notes"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : treatments && treatments.length > 0 ? (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Doctor ID</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Prescription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((treatment) => (<TableRow key={treatment.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(treatment.treatmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{treatment.patientId.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">
                      {treatment.doctorId ? treatment.doctorId.slice(0, 8) + '...' : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{treatment.diagnosis}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{treatment.treatment}</TableCell>
                    <TableCell className="text-sm">{treatment.prescription || "-"}</TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>) : (<div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground">No treatment logs yet</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
