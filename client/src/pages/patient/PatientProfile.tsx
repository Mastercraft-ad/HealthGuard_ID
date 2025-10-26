import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Check } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";

export default function PatientProfile() {
  const { uid, status } = useWallet();
  const { toast } = useToast();
  const [kycData, setKycData] = useState({
    fullName: "",
    dateOfBirth: "",
    nationalId: "",
    phoneNumber: "",
    address: "",
    selectedHospital: "",
    documentType: "national_id",
    documentNumber: "",
  });

  const [healthData, setHealthData] = useState({
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    emergencyContact: "",
    emergencyPhone: "",
    height: "",
    weight: "",
    organDonor: false,
  });

  const { data: kyc } = useQuery<any>({
    queryKey: ["/api/patient/kyc"],
    enabled: !!uid,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/patient/profile"],
    enabled: !!uid,
  });

  const { data: hospitals } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!uid,
    select: (users) => users.filter((u: any) => u.role === "hospital" && u.status === "verified"),
  });

  const submitKYCMutation = useMutation({
    mutationFn: (data: typeof kycData) => apiRequest("POST", "/api/patient/kyc", data),
    onSuccess: () => {
      toast({ title: "KYC Submitted", description: "Your verification is under review" });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/kyc"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/patient/profile", data),
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Your health profile has been saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/profile"] });
    },
  });

  const handleKYCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitKYCMutation.mutate(kycData);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...healthData,
      allergies: healthData.allergies.split(",").map(a => a.trim()).filter(Boolean),
      chronicConditions: healthData.chronicConditions.split(",").map(c => c.trim()).filter(Boolean),
      currentMedications: healthData.currentMedications.split(",").map(m => m.trim()).filter(Boolean),
      height: healthData.height ? parseFloat(healthData.height) : undefined,
      weight: healthData.weight ? parseFloat(healthData.weight) : undefined,
    };
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile & KYC</h1>
        <p className="text-muted-foreground">Manage your identity verification and health information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProfilePictureUpload />
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>Submit your identity documents for verification</CardDescription>
              </div>
              {kyc && (
                <Badge variant={kyc.status === "approved" ? "default" : kyc.status === "rejected" ? "destructive" : "outline"} data-testid="badge-kyc-status">
                  {kyc.status === "approved" && <Check className="mr-1 h-3 w-3" />}
                  {kyc.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {kyc && kyc.status === "approved" ? (
              <div className="text-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/10 text-chart-2 mx-auto mb-4">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verification Complete</h3>
                <p className="text-muted-foreground">Your identity has been verified successfully</p>
              </div>
            ) : (
              <form onSubmit={handleKYCSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={kycData.fullName}
                      onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                      required
                      data-testid="input-full-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={kycData.dateOfBirth}
                      onChange={(e) => setKycData({ ...kycData, dateOfBirth: e.target.value })}
                      required
                      data-testid="input-dob"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={kycData.nationalId}
                      onChange={(e) => setKycData({ ...kycData, nationalId: e.target.value })}
                      required
                      data-testid="input-national-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={kycData.phoneNumber}
                      onChange={(e) => setKycData({ ...kycData, phoneNumber: e.target.value })}
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={kycData.address}
                    onChange={(e) => setKycData({ ...kycData, address: e.target.value })}
                    required
                    data-testid="input-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selectedHospital">Select Hospital</Label>
                  <Select value={kycData.selectedHospital} onValueChange={(v) => setKycData({ ...kycData, selectedHospital: v })}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select value={kycData.documentType} onValueChange={(v) => setKycData({ ...kycData, documentType: v })}>
                      <SelectTrigger data-testid="select-document-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Document Number</Label>
                    <Input
                      id="documentNumber"
                      value={kycData.documentNumber}
                      onChange={(e) => setKycData({ ...kycData, documentNumber: e.target.value })}
                      required
                      data-testid="input-document-number"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={submitKYCMutation.isPending} data-testid="button-submit-kyc">
                  {submitKYCMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Verification
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Current verification state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Account Status</p>
              <Badge variant={status === "verified" ? "default" : "outline"} className="text-sm" data-testid="badge-account-status">
                {status}
              </Badge>
            </div>
            {kyc && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">KYC Status</p>
                  <Badge variant={kyc.status === "approved" ? "default" : "outline"} className="text-sm">
                    {kyc.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Submitted</p>
                  <p className="text-sm font-mono">{new Date(kyc.submittedAt).toLocaleString()}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health Profile</CardTitle>
          <CardDescription>Emergency medical information (encrypted)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={healthData.bloodType} onValueChange={(v) => setHealthData({ ...healthData, bloodType: v })}>
                  <SelectTrigger data-testid="select-blood-type">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={healthData.height}
                  onChange={(e) => setHealthData({ ...healthData, height: e.target.value })}
                  data-testid="input-height"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={healthData.weight}
                  onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })}
                  data-testid="input-weight"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (comma-separated)</Label>
              <Input
                id="allergies"
                value={healthData.allergies}
                onChange={(e) => setHealthData({ ...healthData, allergies: e.target.value })}
                placeholder="e.g., Penicillin, Peanuts, Latex"
                data-testid="input-allergies"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronicConditions">Chronic Conditions (comma-separated)</Label>
              <Input
                id="chronicConditions"
                value={healthData.chronicConditions}
                onChange={(e) => setHealthData({ ...healthData, chronicConditions: e.target.value })}
                placeholder="e.g., Diabetes, Hypertension"
                data-testid="input-chronic-conditions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
              <Input
                id="currentMedications"
                value={healthData.currentMedications}
                onChange={(e) => setHealthData({ ...healthData, currentMedications: e.target.value })}
                placeholder="e.g., Metformin 500mg, Aspirin 81mg"
                data-testid="input-medications"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={healthData.emergencyContact}
                  onChange={(e) => setHealthData({ ...healthData, emergencyContact: e.target.value })}
                  data-testid="input-emergency-contact"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={healthData.emergencyPhone}
                  onChange={(e) => setHealthData({ ...healthData, emergencyPhone: e.target.value })}
                  data-testid="input-emergency-phone"
                />
              </div>
            </div>
            <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-update-profile">
              {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Health Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
