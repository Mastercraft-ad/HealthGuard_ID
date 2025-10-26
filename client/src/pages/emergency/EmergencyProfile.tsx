import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/contexts/WalletContext";
import { User, Briefcase, Shield, Loader2 } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import HealthProfileForm from "@/components/HealthProfileForm";
import QRGeneratorCard from "@/components/QRGeneratorCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EmergencyProfile() {
  const { walletAddress, uid } = useWallet();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    hospitalName: "",
    fullName: "",
    badgeNumber: "",
    contactNumber: "",
    serviceType: "",
    organization: "",
    certificationLevel: "",
    licenseNumber: "",
    yearsOfService: "",
    jurisdiction: "",
    certificationExpiry: "",
  });

  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    enabled: !!walletAddress,
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData(prev => ({
        ...prev,
        username: userProfile.username || "",
        email: userProfile.email || "",
        hospitalName: userProfile.hospitalName || "",
      }));
    }
  }, [userProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) => apiRequest("PUT", "/api/user/profile", data),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your emergency responder profile has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Responder Profile</h1>
        <p className="text-muted-foreground">Manage your professional credentials</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfilePictureUpload />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>Your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Health ID (UID)</Label>
                <Input value={uid || ""} disabled className="font-mono" data-testid="input-uid" />
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input value={walletAddress || ""} disabled className="font-mono text-xs" data-testid="input-wallet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="emt_smith"
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  placeholder="John Smith"
                  data-testid="input-full-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badgeNumber">Badge Number</Label>
                <Input
                  id="badgeNumber"
                  value={profileData.badgeNumber}
                  onChange={(e) => setProfileData({ ...profileData, badgeNumber: e.target.value })}
                  placeholder="EMT-12345"
                  data-testid="input-badge"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={profileData.contactNumber}
                  onChange={(e) => setProfileData({ ...profileData, contactNumber: e.target.value })}
                  placeholder="+1 (555) 987-6543"
                  data-testid="input-contact"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <CardTitle>Professional Details</CardTitle>
              </div>
              <CardDescription>Emergency service credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={profileData.serviceType}
                  onChange={(e) => setProfileData({ ...profileData, serviceType: e.target.value })}
                  placeholder="Paramedic / EMT / First Responder"
                  data-testid="input-service-type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={profileData.organization}
                  onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                  placeholder="City EMS / Fire Department"
                  data-testid="input-organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificationLevel">Certification Level</Label>
                <Input
                  id="certificationLevel"
                  value={profileData.certificationLevel}
                  onChange={(e) => setProfileData({ ...profileData, certificationLevel: e.target.value })}
                  placeholder="EMT-Paramedic"
                  data-testid="input-cert-level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={profileData.licenseNumber}
                  onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                  placeholder="EMS-123456"
                  data-testid="input-license"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfService">Years of Service</Label>
                <Input
                  id="yearsOfService"
                  type="number"
                  value={profileData.yearsOfService}
                  onChange={(e) => setProfileData({ ...profileData, yearsOfService: e.target.value })}
                  placeholder="5"
                  data-testid="input-years-service"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Access Credentials</CardTitle>
              </div>
              <CardDescription>Emergency access authorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Authorization Level</Label>
                <Input value="Emergency Medical Services" disabled data-testid="input-auth-level" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  value={profileData.jurisdiction}
                  onChange={(e) => setProfileData({ ...profileData, jurisdiction: e.target.value })}
                  placeholder="County / Region"
                  data-testid="input-jurisdiction"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificationExpiry">Certification Expiry</Label>
                <Input
                  id="certificationExpiry"
                  type="date"
                  value={profileData.certificationExpiry}
                  onChange={(e) => setProfileData({ ...profileData, certificationExpiry: e.target.value })}
                  data-testid="input-expiry"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Upload professional credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>EMT License (PDF)</Label>
                <Input type="file" accept=".pdf" data-testid="input-license-file" />
              </div>
              <div className="space-y-2">
                <Label>Service Badge Photo</Label>
                <Input type="file" accept="image/*" data-testid="input-badge-photo" />
              </div>
              <div className="space-y-2">
                <Label>Authorization Letter (PDF)</Label>
                <Input type="file" accept=".pdf" data-testid="input-auth-letter" />
              </div>
            </CardContent>
          </Card>
          
          <QRGeneratorCard />
        </div>

        <div className="mt-6">
          <HealthProfileForm />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" data-testid="button-cancel">Cancel</Button>
          <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save">
            {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
