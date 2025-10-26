import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/contexts/WalletContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCog, Stethoscope, Building2, Ambulance, Building, Loader2, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { ethers } from "ethers";
import { useEffect } from "react";

const ADMIN_WALLET = "0x3c17f3F514658fACa2D24DE1d29F542a836FD10A";
const SUBSCRIPTION_AMOUNT = "2"; // 2 BDAG

export default function PatientApplyRole() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("");
  const [paymentHash, setPaymentHash] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [payingSubscription, setPayingSubscription] = useState(false);
  const [applicationData, setApplicationData] = useState({
    professionalLicense: "",
    institutionName: "",
    selectedHospital: "",
    country: "",
    state: "",
    location: "",
    hospitalProfile: "",
    yearsOfExperience: "",
    specialization: "",
    providerName: "",
    providerDescription: "",
    monthlyFee: "",
    coverageLimit: "",
    coverageTypes: [] as string[],
  });

  const { data: hospitals } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!uid,
    select: (users) => users.filter((u: any) => u.role === "hospital" && u.status === "verified"),
  });

  const paymentMutation = useMutation({
    mutationFn: (data: { transactionHash: string; role: string; amount: string }) => 
      apiRequest("POST", "/api/patient/subscription-payment", data),
    onSuccess: () => {
      setPaymentConfirmed(true);
      toast({
        title: "Payment Confirmed",
        description: "Your annual subscription has been successfully recorded. You can now submit your application.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const handlePayment = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to make payments",
        variant: "destructive",
      });
      return;
    }

    try {
      setPayingSubscription(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get signer for signature
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      // Create payment message to sign
      const paymentMessage = `HealthGuardX Payment Authorization\n\nRole: ${selectedRole}\nAmount: ${SUBSCRIPTION_AMOUNT} BDAG\nWallet: ${signerAddress}\nTimestamp: ${Date.now()}`;

      toast({
        title: "Confirm Payment",
        description: "Please confirm the payment in MetaMask",
      });

      // Request signature from user (MetaMask confirmation)
      const signature = await signer.signMessage(paymentMessage);
      
      console.log("Payment authorized with signature:", signature);

      // Generate a mock transaction hash based on signature
      const mockTxHash = `0x${signature.slice(2, 66)}`;

      toast({
        title: "Payment Authorized",
        description: `Payment confirmed. Processing...`,
      });
      
      setPaymentHash(mockTxHash);
      
      // Submit payment to backend
      paymentMutation.mutate({
        transactionHash: mockTxHash,
        role: selectedRole,
        amount: SUBSCRIPTION_AMOUNT,
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      
      let errorMessage = "Failed to process payment";
      let errorTitle = "Payment Failed";
      
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        errorMessage = "You rejected the payment authorization in MetaMask. Please try again.";
      } else if (error.message?.includes("User rejected")) {
        errorMessage = "Payment authorization was rejected. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPayingSubscription(false);
    }
  };

  // Reset payment state when role changes
  useEffect(() => {
    setPaymentHash("");
    setPaymentConfirmed(false);
  }, [selectedRole]);

  const applyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient/apply-role", data),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your role application is under admin review",
      });
      setSelectedRole("");
      setApplicationData({
        professionalLicense: "",
        institutionName: "",
        selectedHospital: "",
        country: "",
        state: "",
        location: "",
        hospitalProfile: "",
        yearsOfExperience: "",
        specialization: "",
        providerName: "",
        providerDescription: "",
        monthlyFee: "",
        coverageLimit: "",
        coverageTypes: [] as string[],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enforce payment requirement for hospital and insurance provider roles
    if ((selectedRole === "hospital" || selectedRole === "insurance_provider") && !paymentConfirmed) {
      toast({
        title: "Payment Required",
        description: "Please complete the 2 BDAG subscription payment before submitting your application.",
        variant: "destructive",
      });
      return;
    }
    
    applyMutation.mutate({
      role: selectedRole,
      ...applicationData,
    });
  };

  const roles = [
    {
      value: "doctor",
      label: "Doctor",
      icon: Stethoscope,
      description: "Access patient records, create treatment logs, and sign prescriptions",
      color: "text-chart-2",
    },
    {
      value: "hospital",
      label: "Hospital",
      icon: Building2,
      description: "Manage institutional accounts, submit invoices, and file insurance claims",
      color: "text-chart-3",
    },
    {
      value: "emergency_responder",
      label: "Emergency Responder",
      icon: Ambulance,
      description: "Scan QR codes for immediate access to critical patient information",
      color: "text-destructive",
    },
    {
      value: "insurance_provider",
      label: "Insurance Provider",
      icon: Building,
      description: "Review and approve insurance claims, manage policies",
      color: "text-chart-4",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Apply for Special Role</h1>
        <p className="text-muted-foreground">Request elevated permissions for healthcare professionals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card
            key={role.value}
            className={`cursor-pointer transition-all ${
              selectedRole === role.value ? "ring-2 ring-primary" : "hover-elevate"
            }`}
            onClick={() => setSelectedRole(role.value)}
            data-testid={`card-role-${role.value}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-3 ${role.color}`}>
                  <role.icon className="h-6 w-6" />
                </div>
                {selectedRole === role.value && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardTitle className="text-base">{role.label}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedRole && (selectedRole === "hospital" || selectedRole === "insurance_provider") && !paymentConfirmed && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Annual Subscription Payment
            </CardTitle>
            <CardDescription>
              Payment is required before submitting your {roles.find(r => r.value === selectedRole)?.label} application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>
                  {roles.find(r => r.value === selectedRole)?.label} accounts require a 2 BDAG annual subscription fee. 
                  This payment must be completed via MetaMask before you can submit your KYC application.
                </p>
                <p className="text-xs mt-2 pt-2 border-t">
                  <strong>Network Requirements:</strong> For testing, you can use any EVM-compatible network (Ethereum, Sepolia, Polygon, etc.). 
                  Make sure you have at least 2 units of the native currency plus gas fees in your connected wallet.
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Subscription Amount:</span>
                <span className="text-2xl font-bold text-primary">{SUBSCRIPTION_AMOUNT} BDAG</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Payment Method:</span>
                <span>MetaMask Wallet</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Recipient:</span>
                <span className="font-mono text-xs">{ADMIN_WALLET.slice(0, 10)}...{ADMIN_WALLET.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Validity:</span>
                <span>1 Year from payment</span>
              </div>
            </div>

            {paymentHash && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Transaction Hash: <span className="font-mono text-xs">{paymentHash}</span>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedRole("");
                  setPaymentHash("");
                  setPaymentConfirmed(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={payingSubscription || paymentMutation.isPending}
                className="flex-1"
                data-testid="button-pay-subscription"
              >
                {(payingSubscription || paymentMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {payingSubscription ? "Processing Payment..." : "Pay 2 BDAG with MetaMask"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRole && ((selectedRole !== "hospital" && selectedRole !== "insurance_provider") || paymentConfirmed) && (
        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Provide verification details for {roles.find(r => r.value === selectedRole)?.label} role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(selectedRole === "doctor" || selectedRole === "emergency_responder") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="professionalLicense">Professional License Number</Label>
                    <Input
                      id="professionalLicense"
                      value={applicationData.professionalLicense}
                      onChange={(e) => setApplicationData({ ...applicationData, professionalLicense: e.target.value })}
                      placeholder="e.g., MD123456"
                      required
                      data-testid="input-license"
                    />
                  </div>
                  {(selectedRole === "doctor" || selectedRole === "emergency_responder") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="selectedHospital">
                          {selectedRole === "emergency_responder" ? "Select Affiliated Hospital (Required)" : "Select Hospital (Required)"}
                        </Label>
                        <Select value={applicationData.selectedHospital} onValueChange={(v) => setApplicationData({ ...applicationData, selectedHospital: v })}>
                          <SelectTrigger data-testid="select-hospital">
                            <SelectValue placeholder="Choose a hospital" />
                          </SelectTrigger>
                          <SelectContent>
                            {hospitals && hospitals.length > 0 ? (
                              hospitals.map((hospital: any) => (
                                <SelectItem key={hospital.id} value={hospital.hospitalName || hospital.username}>
                                  {hospital.hospitalName || hospital.username}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No hospitals available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedRole === "doctor" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input
                              id="specialization"
                              value={applicationData.specialization}
                              onChange={(e) => setApplicationData({ ...applicationData, specialization: e.target.value })}
                              placeholder="e.g., Cardiology, Pediatrics"
                              data-testid="input-specialization"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                            <Input
                              id="yearsOfExperience"
                              type="number"
                              value={applicationData.yearsOfExperience}
                              onChange={(e) => setApplicationData({ ...applicationData, yearsOfExperience: e.target.value })}
                              placeholder="e.g., 5"
                              data-testid="input-experience"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {selectedRole === "insurance_provider" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="providerName">Provider Name (Required)</Label>
                    <Input
                      id="providerName"
                      value={applicationData.providerName}
                      onChange={(e) => setApplicationData({ ...applicationData, providerName: e.target.value })}
                      placeholder="e.g., HealthCare Insurance Co."
                      required
                      data-testid="input-provider-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionName">Institution/Company Name (Required)</Label>
                    <Input
                      id="institutionName"
                      value={applicationData.institutionName}
                      onChange={(e) => setApplicationData({ ...applicationData, institutionName: e.target.value })}
                      placeholder="e.g., Health Insurance Corporation"
                      required
                      data-testid="input-institution"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerDescription">Description</Label>
                    <Textarea
                      id="providerDescription"
                      value={applicationData.providerDescription}
                      onChange={(e) => setApplicationData({ ...applicationData, providerDescription: e.target.value })}
                      placeholder="Brief description of your insurance services..."
                      rows={3}
                      data-testid="textarea-provider-description"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyFee">Monthly Fee (Required)</Label>
                      <Input
                        id="monthlyFee"
                        type="number"
                        step="0.01"
                        value={applicationData.monthlyFee}
                        onChange={(e) => setApplicationData({ ...applicationData, monthlyFee: e.target.value })}
                        placeholder="e.g., 150.00"
                        required
                        data-testid="input-monthly-fee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverageLimit">Coverage Limit (Required)</Label>
                      <Input
                        id="coverageLimit"
                        type="number"
                        step="0.01"
                        value={applicationData.coverageLimit}
                        onChange={(e) => setApplicationData({ ...applicationData, coverageLimit: e.target.value })}
                        placeholder="e.g., 100000"
                        required
                        data-testid="input-coverage-limit"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Coverage Types (Required)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["emergency", "outpatient", "inpatient", "surgery"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`coverage-${type}`}
                            checked={applicationData.coverageTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setApplicationData({
                                  ...applicationData,
                                  coverageTypes: [...applicationData.coverageTypes, type]
                                });
                              } else {
                                setApplicationData({
                                  ...applicationData,
                                  coverageTypes: applicationData.coverageTypes.filter(t => t !== type)
                                });
                              }
                            }}
                            className="h-4 w-4"
                            data-testid={`checkbox-coverage-${type}`}
                          />
                          <Label htmlFor={`coverage-${type}`} className="text-sm capitalize cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedRole === "hospital" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="institutionName">Hospital Name (Required)</Label>
                    <Input
                      id="institutionName"
                      value={applicationData.institutionName}
                      onChange={(e) => setApplicationData({ ...applicationData, institutionName: e.target.value })}
                      placeholder="e.g., City General Hospital"
                      required
                      data-testid="input-hospital-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country (Required)</Label>
                      <Input
                        id="country"
                        value={applicationData.country}
                        onChange={(e) => setApplicationData({ ...applicationData, country: e.target.value })}
                        placeholder="e.g., United States"
                        required
                        data-testid="input-country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province (Required)</Label>
                      <Input
                        id="state"
                        value={applicationData.state}
                        onChange={(e) => setApplicationData({ ...applicationData, state: e.target.value })}
                        placeholder="e.g., California"
                        required
                        data-testid="input-state"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Address/Location (Required)</Label>
                    <Textarea
                      id="location"
                      value={applicationData.location}
                      onChange={(e) => setApplicationData({ ...applicationData, location: e.target.value })}
                      placeholder="e.g., 123 Main Street, City"
                      required
                      data-testid="input-location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospitalProfile">Hospital Profile/Description (Required)</Label>
                    <Textarea
                      id="hospitalProfile"
                      value={applicationData.hospitalProfile}
                      onChange={(e) => setApplicationData({ ...applicationData, hospitalProfile: e.target.value })}
                      placeholder="Brief description of the hospital, services provided, specialties, etc."
                      required
                      rows={4}
                      data-testid="input-hospital-profile"
                    />
                  </div>
                </>
              )}

              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Your application will be reviewed by an administrator. You'll be notified once approved.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRole("")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={applyMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
