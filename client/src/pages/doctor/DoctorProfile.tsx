import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";
import { User, Briefcase, Award, Loader2 } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import HealthProfileForm from "@/components/HealthProfileForm";
import QRGeneratorCard from "@/components/QRGeneratorCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DoctorProfile() {
  const { walletAddress, uid } = useWallet();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    hospitalName: "",
    fullName: "",
    phoneNumber: "",
    licenseNumber: "",
    specialization: "",
    yearsOfExperience: "",
    professionalBio: "",
    medicalDegree: "",
    boardCertifications: "",
    additionalCertifications: "",
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
        description: "Your doctor profile has been saved successfully",
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
        <h1 className="text-3xl font-bold">Doctor Profile</h1>
        <p className="text-muted-foreground">Manage your professional information</p>
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
                  placeholder="dr_smith"
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  placeholder="Dr. Jane Smith"
                  data-testid="input-full-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="jane.smith@hospital.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
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
              <CardDescription>Medical credentials and specialization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Medical License Number</Label>
                <Input
                  id="licenseNumber"
                  value={profileData.licenseNumber}
                  onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                  placeholder="MD123456"
                  data-testid="input-license"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={profileData.specialization}
                  onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                  placeholder="Cardiology"
                  data-testid="input-specialization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital/Practice</Label>
                <Input
                  id="hospitalName"
                  value={profileData.hospitalName}
                  onChange={(e) => setProfileData({ ...profileData, hospitalName: e.target.value })}
                  placeholder="City General Hospital"
                  data-testid="input-hospital-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={profileData.yearsOfExperience}
                  onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: e.target.value })}
                  placeholder="10"
                  data-testid="input-experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalBio">Professional Bio</Label>
                <Textarea
                  id="professionalBio"
                  value={profileData.professionalBio}
                  onChange={(e) => setProfileData({ ...profileData, professionalBio: e.target.value })}
                  placeholder="Brief description of your medical background and expertise..."
                  rows={4}
                  data-testid="input-bio"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <CardTitle>Qualifications</CardTitle>
              </div>
              <CardDescription>Education and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicalDegree">Medical Degree</Label>
                <Input
                  id="medicalDegree"
                  value={profileData.medicalDegree}
                  onChange={(e) => setProfileData({ ...profileData, medicalDegree: e.target.value })}
                  placeholder="MD, Harvard Medical School"
                  data-testid="input-degree"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardCertifications">Board Certifications</Label>
                <Textarea
                  id="boardCertifications"
                  value={profileData.boardCertifications}
                  onChange={(e) => setProfileData({ ...profileData, boardCertifications: e.target.value })}
                  placeholder="List your board certifications..."
                  rows={3}
                  data-testid="input-board-certs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalCertifications">Additional Certifications</Label>
                <Textarea
                  id="additionalCertifications"
                  value={profileData.additionalCertifications}
                  onChange={(e) => setProfileData({ ...profileData, additionalCertifications: e.target.value })}
                  placeholder="Additional training and certifications..."
                  rows={3}
                  data-testid="input-additional-certs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Documents</CardTitle>
              <CardDescription>Upload verification documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Medical License (PDF)</Label>
                <Input type="file" accept=".pdf" data-testid="input-license-file" />
              </div>
              <div className="space-y-2">
                <Label>Board Certification (PDF)</Label>
                <Input type="file" accept=".pdf" data-testid="input-cert-file" />
              </div>
              <div className="space-y-2">
                <Label>Professional ID Photo</Label>
                <Input type="file" accept="image/*" data-testid="input-id-photo" />
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
