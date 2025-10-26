import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileText, Users, DollarSign, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { InsurancePolicy } from "@shared/schema";

const policySchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  policyName: z.string().min(1, "Policy name is required"),
  coverageLimit: z.string().min(1, "Coverage limit is required"),
  coverageTypes: z.string().min(1, "Coverage types are required"),
});

export default function InsurancePolicies() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: policies, isLoading } = useQuery<InsurancePolicy[]>({
    queryKey: ["/api/insurance/policies"],
    enabled: !!uid,
  });

  const form = useForm<z.infer<typeof policySchema>>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policyNumber: "",
      policyName: "",
      coverageLimit: "",
      coverageTypes: "",
    },
  });

  const createPolicyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/insurance/policies", data),
    onSuccess: () => {
      toast({ title: "Policy Created", description: "Insurance policy has been created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/policies"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create policy", variant: "destructive" });
    },
  });

  const onSubmit = (values: z.infer<typeof policySchema>) => {
    const coverageTypesArray = values.coverageTypes.split(",").map(t => t.trim());
    createPolicyMutation.mutate({
      policyNumber: values.policyNumber,
      policyName: values.policyName,
      coverageLimit: values.coverageLimit,
      coverageTypes: coverageTypesArray,
      isActive: true,
    });
  };

  const totalEnrollees = 0; // This would require a separate query to count enrollments
  const avgCoverage = policies && policies.length > 0
    ? policies.reduce((sum, p) => sum + parseFloat(p.coverageLimit || "0"), 0) / policies.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insurance Policies</h1>
        <p className="text-muted-foreground">Manage policy offerings and enrollments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-policies">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (policies?.filter(p => p.isActive).length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Available plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1" data-testid="text-total-enrollees">
              {totalEnrollees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Coverage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2" data-testid="text-avg-coverage">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `BDAG ${Math.round(avgCoverage).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Per policy</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Policy Directory</CardTitle>
              <CardDescription>All available insurance plans</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-policy">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Policy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Insurance Policy</DialogTitle>
                  <DialogDescription>Add a new insurance policy offering</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="policyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input placeholder="POL-001" {...field} data-testid="input-policy-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="policyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Basic Health Plan" {...field} data-testid="input-policy-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coverageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coverage Limit</FormLabel>
                          <FormControl>
                            <Input placeholder="50000" {...field} data-testid="input-coverage-limit" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coverageTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coverage Types (comma-separated)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="emergency, outpatient, inpatient" 
                              {...field} 
                              data-testid="input-coverage-types" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPolicyMutation.isPending}
                        data-testid="button-submit-policy"
                      >
                        {createPolicyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Policy
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
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !policies || policies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No policies created yet</p>
              <p className="text-sm">Create your first policy to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Coverage Limit</TableHead>
                  <TableHead>Coverage Types</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
                    <TableCell className="font-mono text-xs" data-testid="text-policy-number">
                      {policy.policyNumber}
                    </TableCell>
                    <TableCell className="font-medium" data-testid="text-policy-name">
                      {policy.policyName}
                    </TableCell>
                    <TableCell className="font-semibold" data-testid="text-coverage-limit">
                      BDAG {parseFloat(policy.coverageLimit || "0").toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {policy.coverageTypes?.slice(0, 2).map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                        {policy.coverageTypes && policy.coverageTypes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{policy.coverageTypes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.isActive ? "default" : "outline"} data-testid="badge-policy-status">
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
