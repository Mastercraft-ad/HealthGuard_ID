import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { FileCheck, Activity, Users, Plus, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const treatmentFormSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  hospitalId: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatment: z.string().min(1, "Treatment is required"),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  treatmentDate: z.string().min(1, "Treatment date is required"),
});

export default function DoctorTreatments() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [treatmentFiles, setTreatmentFiles] = useState<Array<{ name: string; type: string; data: string }>>([]);

  const { data: treatments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/treatments"],
    enabled: !!uid,
  });

  const form = useForm<z.infer<typeof treatmentFormSchema>>({
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
    mutationFn: async (data: z.infer<typeof treatmentFormSchema>) => {
      const payload = {
        ...data,
        treatmentFiles: treatmentFiles.length > 0 ? treatmentFiles : undefined,
      };
      return apiRequest("POST", "/api/doctor/treatments", payload);
    },
    onSuccess: () => {
      toast({
        title: "Treatment log created",
        description: "Treatment record has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hospital/patients"] });
      setDialogOpen(false);
      form.reset();
      setTreatmentFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create treatment log",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTreatmentFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            data: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setTreatmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: z.infer<typeof treatmentFormSchema>) => {
    createTreatmentMutation.mutate(data);
  };

  const thisMonth = treatments?.filter((t: any) => {
    const date = new Date(t.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }) || [];

  const uniquePatients = new Set(treatments?.map((t: any) => t.patientId) || []).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Treatment Logs</h1>
        <p className="text-muted-foreground">Your signed treatment records and consultations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Treatments</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{thisMonth.length}</div>
            <p className="text-xs text-muted-foreground">Consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
              <CardDescription>Complete record of signed treatment logs</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-treatment">
                  <Plus className="h-4 w-4 mr-2" />
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
                      <FormField
                        control={form.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Patient ID" {...field} data-testid="input-patient-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hospitalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hospital ID (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Hospital ID" {...field} data-testid="input-hospital-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="treatmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-treatment-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter diagnosis..." 
                              {...field} 
                              rows={2}
                              data-testid="input-diagnosis" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="treatment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the treatment provided..." 
                              {...field} 
                              rows={3}
                              data-testid="input-treatment" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescription (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter prescription details..." 
                              {...field} 
                              rows={2}
                              data-testid="input-prescription" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes..." 
                              {...field} 
                              rows={2}
                              data-testid="input-notes" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Treatment Files (Optional)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="cursor-pointer"
                          data-testid="input-treatment-files"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {treatmentFiles.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {treatmentFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                              <span className="text-sm truncate flex-1">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                data-testid={`button-remove-file-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload treatment documents, lab results, or prescriptions (Max 10MB per file)
                      </p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTreatmentMutation.isPending} data-testid="button-submit-treatment">
                        {createTreatmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : treatments && treatments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead>Signature</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((treatment: any) => (
                  <TableRow key={treatment.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(treatment.treatmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{treatment.patientId.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{treatment.diagnosis}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{treatment.treatment}</TableCell>
                    <TableCell className="text-sm">{treatment.prescription || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {treatment.doctorSignature.slice(0, 10)}...
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No treatment logs yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
