import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Building, Shield, Settings, DollarSign, RefreshCw, AlertCircle, Heart, X, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
export default function InsuranceSettings() {
    const { toast } = useToast();
    const { uid } = useWallet();
    const [providerName, setProviderName] = useState("");
    const [description, setDescription] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");
    const [coverageLimit, setCoverageLimit] = useState("");
    const [coverageTypesInput, setCoverageTypesInput] = useState("");
    const [selectedCoverageTypes, setSelectedCoverageTypes] = useState([]);
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["/api/insurance/profile"],
        enabled: !!uid,
    });
    useEffect(() => {
        if (profile) {
            setProviderName(profile.providerName ?? "");
            setDescription(profile.description ?? "");
            setMonthlyFee(profile.monthlyFee?.toString() ?? "");
            setCoverageLimit(profile.coverageLimit?.toString() ?? "");
            setSelectedCoverageTypes(profile.coverageTypes ?? []);
        }
    }, [profile]);
    const addCoverageType = () => {
        const trimmed = coverageTypesInput.trim();
        if (trimmed && !selectedCoverageTypes.includes(trimmed)) {
            setSelectedCoverageTypes([...selectedCoverageTypes, trimmed]);
            setCoverageTypesInput("");
        }
    };
    const removeCoverageType = (type) => {
        setSelectedCoverageTypes(selectedCoverageTypes.filter(t => t !== type));
    };
    const saveProfileMutation = useMutation({
        mutationFn: async () => {
            // Validate numeric fields
            const monthlyFeeNum = parseFloat(monthlyFee);
            const coverageLimitNum = parseFloat(coverageLimit);
            if (isNaN(monthlyFeeNum) || monthlyFeeNum < 0) {
                throw new Error("Monthly fee must be a valid number (0 or greater)");
            }
            if (isNaN(coverageLimitNum) || coverageLimitNum < 0) {
                throw new Error("Coverage limit must be a valid number (0 or greater)");
            }
            return apiRequest("PUT", "/api/insurance/profile", {
                providerName,
                description,
                monthlyFee: monthlyFeeNum,
                coverageLimit: coverageLimitNum,
                coverageTypes: selectedCoverageTypes,
            });
        },
        onSuccess: () => {
            toast({
                title: "Profile Updated",
                description: "Your insurance provider profile has been updated successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/insurance/profile"] });
        },
        onError: (error) => {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        },
    });
    const billingMutation = useMutation({
        mutationFn: async () => {
            return apiRequest("POST", "/api/insurance/process-monthly-billing", {});
        },
        onSuccess: (data) => {
            toast({
                title: "Monthly Billing Processed",
                description: `Processed ${data.processed} payments, disconnected ${data.disconnected} patients due to missed payments`,
            });
        },
        onError: (error) => {
            toast({
                title: "Billing Failed",
                description: error.message || "Failed to process monthly billing",
                variant: "destructive",
            });
        },
    });
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Settings</h1>
        <p className="text-muted-foreground">Configure insurance provider information</p>
      </div>

      <ProfilePictureUpload />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5"/>
              <CardTitle>Provider Profile</CardTitle>
            </div>
            <CardDescription>Set up your insurance provider information that patients will see</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (<div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="providerName">
                    Provider Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="providerName" placeholder="e.g., HealthCare Insurance Ltd." value={providerName} onChange={(e) => setProviderName(e.target.value)} data-testid="input-provider-name"/>
                  <p className="text-xs text-muted-foreground">The name patients will see when browsing providers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">
                    Monthly Fee (USD) <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground"/>
                    <Input id="monthlyFee" type="number" step="0.01" placeholder="e.g., 50.00" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} data-testid="input-monthly-fee"/>
                  </div>
                  <p className="text-xs text-muted-foreground">Amount patients pay each month for coverage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverageLimit">
                    Coverage Limit (USD) <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground"/>
                    <Input id="coverageLimit" type="number" step="0.01" placeholder="e.g., 50000.00" value={coverageLimit} onChange={(e) => setCoverageLimit(e.target.value)} data-testid="input-coverage-limit"/>
                  </div>
                  <p className="text-xs text-muted-foreground">Maximum coverage amount per year</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverageTypes">
                    Coverage Types <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input id="coverageTypes" placeholder="e.g., emergency, outpatient" value={coverageTypesInput} onChange={(e) => setCoverageTypesInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCoverageType())} data-testid="input-coverage-type"/>
                    <Button type="button" variant="outline" onClick={addCoverageType} data-testid="button-add-coverage-type">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCoverageTypes.map((type, i) => (<div key={i} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold" data-testid={`badge-coverage-${type}`}>
                        <Heart className="h-3 w-3"/>
                        <span>{type}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCoverageType(type)} className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 rounded-full" data-testid={`button-remove-${type}`}>
                          <X className="h-3 w-3"/>
                        </Button>
                      </div>))}
                  </div>
                  <p className="text-xs text-muted-foreground">Common types: emergency, outpatient, inpatient, surgery</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" placeholder="Describe your insurance services and what makes your coverage unique..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} data-testid="input-description"/>
                  <p className="text-xs text-muted-foreground">A brief description of your insurance services</p>
                </div>
              </div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5"/>
              <CardTitle>Claims Processing</CardTitle>
            </div>
            <CardDescription>Configure claim handling rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-approve small claims</Label>
                <p className="text-sm text-muted-foreground">Claims under threshold</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Auto-approval Threshold</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground"/>
                <Input type="number" placeholder="500"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Standard Processing Time (days)</Label>
              <Input type="number" placeholder="5" defaultValue="5"/>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require invoice verification</Label>
                <p className="text-sm text-muted-foreground">Verify hospital signatures</p>
              </div>
              <Switch defaultChecked/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5"/>
              <CardTitle>Payment Settings</CardTitle>
            </div>
            <CardDescription>Configure payout preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Input value="Bank Transfer" disabled/>
            </div>
            <div className="space-y-2">
              <Label>Payment Frequency</Label>
              <Input value="Weekly" disabled/>
            </div>
            <div className="space-y-2">
              <Label>Minimum Payout Amount</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground"/>
                <Input type="number" placeholder="1000" defaultValue="1000"/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Batch payments</Label>
                <p className="text-sm text-muted-foreground">Group multiple claims</p>
              </div>
              <Switch defaultChecked/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5"/>
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <CardDescription>Manage alert settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New claim notifications</Label>
                <p className="text-sm text-muted-foreground">Alert on submission</p>
              </div>
              <Switch defaultChecked/>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>High-value claim alerts</Label>
                <p className="text-sm text-muted-foreground">Claims over BDAG 10,000</p>
              </div>
              <Switch defaultChecked/>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Fraud detection alerts</Label>
                <p className="text-sm text-muted-foreground">Suspicious activity</p>
              </div>
              <Switch defaultChecked/>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly summary reports</Label>
                <p className="text-sm text-muted-foreground">Email digest</p>
              </div>
              <Switch defaultChecked/>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5"/>
              <CardTitle>Monthly Billing Management</CardTitle>
            </div>
            <CardDescription>Process monthly insurance premiums and manage subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5"/>
              <div className="flex-1 text-sm">
                <p className="font-semibold mb-1">Automated Billing</p>
                <p className="text-muted-foreground">
                  Monthly premiums are automatically charged to all connected patients. After 3 consecutive missed payments, 
                  patients are automatically disconnected from insurance coverage.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="font-semibold">Trigger Monthly Billing Cycle</p>
                <p className="text-sm text-muted-foreground">
                  Manually process this month's billing for all connected patients
                </p>
              </div>
              <Button onClick={() => billingMutation.mutate()} disabled={billingMutation.isPending} data-testid="button-process-billing">
                {billingMutation.isPending ? (<>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                    Processing...
                  </>) : (<>
                    <RefreshCw className="h-4 w-4 mr-2"/>
                    Process Now
                  </>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.location.reload()} data-testid="button-cancel">
          Cancel
        </Button>
        <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending || !providerName || !monthlyFee || !coverageLimit || selectedCoverageTypes.length === 0} data-testid="button-save-settings">
          {saveProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
          Save Profile
        </Button>
      </div>
    </div>);
}
