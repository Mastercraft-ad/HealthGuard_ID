import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileCheck, Clock, CheckCircle, XCircle, Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertClaimSchema } from "@shared/schema";
const claimFormSchema = insertClaimSchema.omit({ hospitalId: true, treatmentLogId: true }).extend({
    patientId: z.string().min(1, "Patient ID is required"),
    connectionId: z.string().min(1, "Insurance connection is required"),
});
export default function HospitalClaims() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const { data: claims, isLoading } = useQuery({
        queryKey: ["/api/hospital/claims"],
        enabled: !!uid,
        refetchInterval: 3000,
    });
    const { data: patientInsurance, isLoading: insuranceLoading } = useQuery({
        queryKey: ["/api/hospital/patients", selectedPatientId, "insurance"],
        enabled: !!selectedPatientId && selectedPatientId.length > 0,
    });
    const form = useForm({
        resolver: zodResolver(claimFormSchema),
        defaultValues: {
            claimNumber: `CLM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            patientId: "",
            connectionId: "",
            amount: "",
            claimType: "outpatient",
            treatmentDescription: "",
            invoiceCID: `Qm${Math.random().toString(36).substring(2, 15)}`,
            invoiceSignature: `SIG-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            status: "pending",
        },
    });
    const submitClaimMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest("POST", "/api/hospital/claims", data);
        },
        onSuccess: () => {
            toast({
                title: "Claim submitted",
                description: "Insurance claim has been submitted successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/hospital/claims"] });
            setDialogOpen(false);
            setSelectedPatientId("");
            form.reset({
                claimNumber: `CLM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
                patientId: "",
                connectionId: "",
                amount: "",
                claimType: "outpatient",
                treatmentDescription: "",
                invoiceCID: `Qm${Math.random().toString(36).substring(2, 15)}`,
                invoiceSignature: `SIG-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                status: "pending",
            });
        },
        onError: (error) => {
            toast({
                title: "Failed to submit claim",
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        submitClaimMutation.mutate(data);
    };
    const handlePatientIdChange = (value) => {
        setSelectedPatientId(value);
        form.setValue("patientId", value);
        form.setValue("connectionId", "");
    };
    const pending = claims?.filter((c) => c.status === "pending") || [];
    const approved = claims?.filter((c) => c.status === "approved" || c.status === "paid") || [];
    const statusBadge = (status) => {
        const variants = {
            pending: { variant: "secondary", icon: Clock },
            approved: { variant: "default", icon: CheckCircle },
            rejected: { variant: "destructive", icon: XCircle },
            paid: { variant: "default", icon: CheckCircle },
        };
        const config = variants[status] || { variant: "outline", icon: FileCheck };
        const Icon = config.icon;
        return (<Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3"/>
        {status.replace(/_/g, " ")}
      </Badge>);
    };
    const activeConnections = patientInsurance && Array.isArray(patientInsurance)
        ? patientInsurance.filter((conn) => conn.status === "connected")
        : [];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insurance Claims</h1>
        <p className="text-muted-foreground">Submit and track insurance reimbursement claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5" data-testid="text-pending-claims">{pending.length}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-approved-claims">{approved.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-claims">{claims?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Claims History</CardTitle>
              <CardDescription>All insurance claim submissions</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-submit-claim">
                  <Plus className="h-4 w-4 mr-2"/>
                  Submit New Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit Insurance Claim</DialogTitle>
                  <DialogDescription>
                    Fill in the details to submit a new insurance claim. Select the patient and their insurance provider.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="claimNumber" render={({ field }) => (<FormItem>
                            <FormLabel>Claim Number</FormLabel>
                            <FormControl>
                              <Input placeholder="CLM-2024-001" {...field} data-testid="input-claim-number"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                      <FormField control={form.control} name="amount" render={({ field }) => (<FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="1000.00" {...field} data-testid="input-amount"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                    </div>

                    <FormField control={form.control} name="patientId" render={({ field }) => (<FormItem>
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                              <Input placeholder="Enter patient ID (e.g., user ID from database)" className="pl-8" {...field} onChange={(e) => handlePatientIdChange(e.target.value)} data-testid="input-patient-id"/>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">Enter the patient's user ID to load their insurance providers</p>
                        </FormItem>)}/>

                    {selectedPatientId && (<FormField control={form.control} name="connectionId" render={({ field }) => (<FormItem>
                            <FormLabel>Patient's Insurance Provider</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-insurance-connection">
                                  <SelectValue placeholder={insuranceLoading ? "Loading insurance providers..." : "Select the patient's insurance provider"}/>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeConnections.length > 0 ? (activeConnections.map((conn) => (<SelectItem key={conn.id} value={conn.id}>
                                      {conn.providerName} - Connected since {new Date(conn.approvedAt).toLocaleDateString()}
                                    </SelectItem>))) : (<div className="p-2 text-sm text-muted-foreground">
                                    {insuranceLoading ? "Loading..." : "No active insurance connections found for this patient"}
                                  </div>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            {!insuranceLoading && activeConnections.length === 0 && selectedPatientId && (<div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5"/>
                                <div className="text-xs text-destructive">
                                  <p className="font-semibold">No Insurance Found</p>
                                  <p>This patient does not have any active insurance connections. Claims cannot be submitted without an active insurance connection.</p>
                                </div>
                              </div>)}
                          </FormItem>)}/>)}

                    <FormField control={form.control} name="claimType" render={({ field }) => (<FormItem>
                          <FormLabel>Claim Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-claim-type">
                                <SelectValue placeholder="Select claim type"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="outpatient">Outpatient</SelectItem>
                              <SelectItem value="inpatient">Inpatient</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>)}/>

                    <FormField control={form.control} name="treatmentDescription" render={({ field }) => (<FormItem>
                          <FormLabel>Treatment Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the treatment provided to the patient..." {...field} value={field.value || ""} rows={3} data-testid="input-treatment-description"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <FormField control={form.control} name="invoiceCID" render={({ field }) => (<FormItem>
                          <FormLabel>Invoice CID (IPFS)</FormLabel>
                          <FormControl>
                            <Input placeholder="Qm..." {...field} data-testid="input-invoice-cid"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
            setDialogOpen(false);
            setSelectedPatientId("");
        }} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitClaimMutation.isPending || activeConnections.length === 0} data-testid="button-confirm-submit">
                        {submitClaimMutation.isPending ? (<>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            Submitting...
                          </>) : ("Submit Claim")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : claims && claims.length > 0 ? (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (<TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                    <TableCell className="font-mono text-xs">{claim.claimNumber}</TableCell>
                    <TableCell className="font-medium">{claim.patientId?.slice(0, 8)}...</TableCell>
                    <TableCell className="font-semibold">${claim.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{claim.claimType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{statusBadge(claim.status)}</TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>) : (<div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <p className="text-muted-foreground">No claims submitted yet</p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
